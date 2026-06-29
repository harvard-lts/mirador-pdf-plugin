# mirador-pdf-plugin

[![Node Unit Tests](https://github.com/harvard-lts/mirador-pdf-plugin/actions/workflows/coverage-node.yml/badge.svg)](https://github.com/harvard-lts/mirador-pdf-plugin/actions/workflows/coverage-node.yml)

<a href="https://github.com/harvard-lts/mirador-pdf-plugin/actions/workflows/coverage-node.yml"><img src="https://github.com/harvard-lts/mirador-pdf-plugin/raw/badges/test-coverage/coverage.svg"></a>

A [Mirador 4](https://projectmirador.org/) plugin that adds a **Download PDF** option to the window top-bar menu. It connects to an external PDF download service and allows users to optionally specify a page number or range before downloading.

## Compatibility

This plugin is **Mirador 4-compatible** (React 18/19, MUI 7). It is **not**
backwards compatible with Mirador 3 — the upgrade contains breaking changes
(top-level `mirador` imports, function/hook components, MUI 7 + Emotion styling).

Versioning convention:

- **Mirador 4** releases are tagged `2.x`.
- **Mirador 3** releases are tagged `0.x` or `1.x` — pin one of these if you
  still need Mirador 3.

## Features

- Adds a **Download PDF** menu item to the Mirador window top-bar plugin menu
- Opens a dialog where users can optionally enter a page number (e.g. `5`) or a range (e.g. `5-10`)
- Validates page input against the total number of pages in the manifest
- Constructs the correct download URL from a configurable API base URL and the manifest's URN
- Opens the download in a new browser tab

## Requirements

- [NVM](https://github.com/nvm-sh/nvm)
- Mirador 4

## Setup

1. Run `npm i` to install dependencies
1. Use one of the [NPM scripts](#npm-scripts) to perform the actions described below.

## NPM scripts

The following are some useful scripts that can be run using `npm run <script>`. A full list can be seen in [package.json](./package.json).

| Script  | Description                                                    |
| ------- | -------------------------------------------------------------- |
| `clean` | Removes the `dist` directories                                 |
| `build` | Builds the source files into the `./dist` directory            |
| `serve` | Spins up the local development server at http://localhost:9000 |
| `test`  | Runs the test suite                                            |

## Installing in Mirador

The `mirador-pdf-plugin` requires an instance of Mirador 4. Visit the [Mirador wiki](https://github.com/ProjectMirador/mirador/wiki) and the [Creating a Mirador 4 Plugin](https://github.com/ProjectMirador/mirador/wiki/Creating-a-Mirador-4-Plugin) page for information about installing and building plugins.

Install the package:

```bash
npm i @harvard-lts/mirador-pdf-plugin
```

## Configuration

Pass a `miradorPdfPlugin` object in your Mirador config block:

```js
import Mirador from 'mirador';
import Plugin from '@harvard-lts/mirador-pdf-plugin';

Mirador.viewer(
  {
    id: 'mirador',
    windows: [
      { manifestId: 'https://example.com/URN-3:FOO:BAR:MANIFEST:1' }
    ],
    miradorPdfPlugin: {
      pdfAPI: 'https://your-pdf-service.example.com/pdf/download/',
      maxPages: 500,
    },
  },
  [...Plugin]
);
```

### Config options

| Option     | Type   | Description                                                                                                                                              |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pdfAPI`   | String | Base URL of the PDF download service (required).                                                                                                         |
| `maxPages` | Number | Maximum pages allowed in a single request (default: 500). Keep this in sync with the service's `MAX_PAGES_PER_REQUEST` env var so client/server agree. |

### URL construction

The plugin derives a URN from the manifest ID by stripping the protocol, hostname, and any `:MANIFEST` suffix. It then builds the download URL as:

```
<pdfAPI>/<URN>
<pdfAPI>/<URN>?page=5
<pdfAPI>/<URN>?start=5&end=10
```

## Contribute

Mirador's development, design, and maintenance is driven by community needs and ongoing feedback and discussion. Join us at our regularly scheduled community calls, on [IIIF slack #mirador](http://bit.ly/iiif-slack), or the [mirador-tech](https://groups.google.com/forum/#!forum/mirador-tech) and [iiif-discuss](https://groups.google.com/forum/#!forum/iiif-discuss) mailing lists. To suggest features, report bugs, and clarify usage, please submit a GitHub issue.

[build-badge]: https://img.shields.io/travis/projectmirador/mirador-pdf-plugin/master.png?style=flat-square
[build]: https://travis-ci.org/projectmirador/mirador-pdf-plugin

[npm-badge]: https://img.shields.io/npm/v/mirador-pdf-plugin.png?style=flat-square
[npm]: https://www.npmjs.org/package/mirador-pdf-plugin
