# Mirador PDF Download Plugin — Implementation Plan

## Overview

Replace the template plugin with a fully functional PDF download plugin. The plugin adds a "Download PDF" menu item to Mirador's window top-bar plugin menu. It opens a MUI dialog with a pages input field, validates the input against the manifest's canvas count, and constructs the correct download URL from the `pdfAPI` config and a URN derived from the manifest ID.

**URN extraction rule:** Given `https://nrs-dev.lib.harvard.edu/URN-3:RAD.SCHL:101118966:MANIFEST:3`, strip the protocol + hostname to get `/URN-3:RAD.SCHL:101118966:MANIFEST:3`, remove the leading `/`, then truncate everything from `:MANIFEST` onward → `URN-3:RAD.SCHL:101118966`.

---

## Steps

### 1. ~~Rename and rewrite the plugin~~ ✅ Done
Replace `src/plugins/MiradorTemplatePlugin.js` (new path: `src/plugins/MiradorPdfPlugin.js`) with a functional React component. Key points:
- `target: 'WindowTopBarPluginMenu'`, `mode: 'add'`
- `mapStateToProps` maps three props:
  - `manifestId` — from `getManifestoInstance(state, { windowId }).id`
  - `totalPages` — from `manifest.getTotalCanvases()`
  - `pdfAPI` — from `state.config?.miradorPdfPlugin?.pdfAPI`
- Component holds local state: `open` (dialog visibility), `pages` (field value), `error` (validation message)

### 2. ~~Update `src/index.js`~~ ✅ Done
Import `miradorPdfPlugin` from the new file and export it as both a named export and as the default array export.

### 3. ~~Render the menu item~~ ✅ Done
Return a MUI `MenuItem` (from `@material-ui/core/MenuItem`) with text "Download PDF". On click:
- Call `handleMenuItemClick()` (Mirador-provided prop that closes the dropdown)
- Set `open = true`

### 4. ~~Build the Modal~~ ✅ Done
Render a MUI `Dialog` (controlled by `open`) alongside the `MenuItem` inside a React Fragment. Structure:
- `DialogTitle`: "PDF Download"
- `DialogContent`: introductory lorem ipsum paragraph + a `TextField` labeled "Pages" with `error` and `helperText` props wired to the validation state
- `DialogActions`: "Download" button and "Close" button

### 5. ~~Implement Close~~ ✅ Done
"Close" button handler and dialog `onClose` both:
- Set `open = false`
- Reset `pages = ''`
- Reset `error = ''`

### 6. Implement validation
On "Download" click, validate the `pages` field:
- **Empty**: skip validation and proceed without page params (download entire document)
- **Single number** `/^\d+$/`: number must be ≥ 1 and ≤ `totalPages`
- **Range** `/^\d+-\d+$/`: both parts must be ≥ 1, start < end, end must be ≤ `totalPages`
- **Anything else**: set error `"Please enter a page number or range (e.g. 5 or 5-10)"`

### 7. Implement URN extraction helper
Add a small pure function `extractUrn(manifestId)` that:
1. Parses the URL and takes the pathname
2. Strips the leading `/`
3. Removes `:MANIFEST` and everything after it (e.g. using `.split(':MANIFEST')[0]`)

Example: `https://nrs-dev.lib.harvard.edu/URN-3:RAD.SCHL:101118966:MANIFEST:3` → `URN-3:RAD.SCHL:101118966`

### 8. Implement Download
On valid input, construct the URL:
- `urn = extractUrn(manifestId)`
- `baseUrl = pdfAPI.replace(/\/$/, '') + '/' + urn`
- **No pages**: open `baseUrl` in new tab
- **Single number**: open `${baseUrl}?page=${pages}`
- **Range**: split on `-`, open `${baseUrl}?start=${start}&end=${end}`
- Use `window.open(url, '_blank')`, then close the dialog

### 9. Write tests
Create `src/__tests__/MiradorPdfPlugin.test.js` and cover:
- Menu item renders with "Download PDF" text
- Clicking menu item opens the dialog
- Close button hides the dialog and resets form
- Invalid input (letters, special chars) sets an error message
- Single page exceeding `totalPages` sets an error
- Range with end exceeding `totalPages` sets an error
- Valid single page constructs `?page=N` URL and calls `window.open`
- Valid range constructs `?start=N&end=M` URL and calls `window.open`
- Empty pages field opens the base URL without query params

---

## Verification

- Run `npm run start` (Vite dev server on port 9000) and open the demo; the window top-bar menu should contain "Download PDF"
- Verify dialog opens, close resets state, invalid input shows errors, and the browser opens the expected URL in a new tab
- Run `npm test` to confirm all Vitest tests pass

---

## Notes & Decisions

- MUI v4 (`@material-ui/core`) is used — it's bundled transitively by Mirador 3, so no new `package.json` dependency is needed
- The plugin is a single-file functional component (no Redux `mapDispatchToProps` needed — all state is local)
- `handleMenuItemClick` is called on "Download PDF" click to properly close the Mirador dropdown before the dialog appears
- Empty pages field is allowed and triggers a full-document download (no query params)
