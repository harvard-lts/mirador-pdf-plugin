import { useState, useEffect, useMemo } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getManifestoInstance } from 'mirador';

const mapStateToProps = (state, { windowId }) => {
  const manifest = getManifestoInstance(state, { windowId });
  return {
    open:
      state.windowDialogs &&
      state.windowDialogs[windowId] &&
      state.windowDialogs[windowId].openDialog === 'PDF_DOWNLOAD',
    manifestId: (manifest || {}).id,
    totalPages: manifest ? (manifest.getSequences()[0]?.getTotalCanvases() || 0) : 0,
    pdfAPI: state.config?.miradorPdfPlugin?.pdfAPI,
    maxPages: state.config?.miradorPdfPlugin?.maxPages || 500,
    containerId: state.config.id,
  };
};

const mapDispatchToProps = (dispatch, { windowId }) => ({
  closeDialog: () => dispatch({ type: 'CLOSE_WINDOW_DIALOG', windowId }),
});

export const extractUrn = (manifestId) => {
  const pathname = new URL(manifestId).pathname;
  const withoutLeadingSlash = pathname.replace(/^\//, '');
  return withoutLeadingSlash.split(':MANIFEST')[0];
};

// Pure validation of the pages input. Returns { valid, message } so it can drive
// both the inline error text and the disabled state of the Download button
// without setting React state during render.
export const validatePages = (pages, totalPages, maxPages) => {
  if (pages === '') {
    // Empty input means "all pages" — only valid if the whole document fits.
    if (totalPages > maxPages) {
      return {
        valid: false,
        message: `This document has ${totalPages} pages, which exceeds the ${maxPages}-page limit. Please enter a range of up to ${maxPages} pages.`,
      };
    }
    return { valid: true, message: '' };
  }

  const singlePattern = /^\d+$/;
  const rangePattern = /^(\d+)-(\d+)$/;

  if (singlePattern.test(pages)) {
    const num = parseInt(pages, 10);
    if (num < 1 || num > totalPages) {
      return { valid: false, message: `Page must be between 1 and ${totalPages}.` };
    }
    return { valid: true, message: '' };
  }

  const rangeMatch = pages.match(rangePattern);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start < 1 || end > totalPages) {
      return { valid: false, message: `Page range must be between 1 and ${totalPages}.` };
    }
    if (start >= end) {
      return { valid: false, message: 'Start page must be less than end page.' };
    }
    if ((end - start) + 1 > maxPages) {
      return {
        valid: false,
        message: `You can request at most ${maxPages} pages at once. Please split this into smaller requests.`,
      };
    }
    return { valid: true, message: '' };
  }

  return { valid: false, message: 'Please enter a page number or range (e.g. 5 or 5-10).' };
};

const MiradorPdfDialog = ({
  open = false,
  closeDialog,
  manifestId,
  totalPages,
  pdfAPI,
  maxPages = 500,
  containerId = null,
}) => {
  const [pages, setPages] = useState('');

  // Reset form state whenever the dialog is closed
  useEffect(() => {
    if (!open) {
      setPages('');
    }
  }, [open]);

  const handleClose = () => {
    closeDialog();
    setPages('');
  };

  // Live validity drives both the disabled Download button and the helper text.
  const validity = useMemo(
    () => validatePages(pages, totalPages, maxPages),
    [pages, totalPages, maxPages]
  );

  const handleDownload = () => {
    if (!validity.valid) return;

    const urn = extractUrn(manifestId);
    const baseUrl = `${pdfAPI.replace(/\/$/, '')}/${urn}`;

    let url;
    if (pages === '') {
      url = baseUrl;
    } else if (/^\d+$/.test(pages)) {
      url = `${baseUrl}?page=${pages}`;
    } else {
      const [start, end] = pages.split('-');
      url = `${baseUrl}?start=${start}&end=${end}`;
    }

    window.open(url, '_blank');
    handleClose();
  };

  if (!open) return null;

  return (
    <Dialog
      container={containerId ? document.querySelector(`#${containerId} .mirador-viewer`) : undefined}
      disableEnforceFocus
      onClose={handleClose}
      open={open}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle variant="h2" sx={{ paddingBottom: 0 }}>
        PDF Download
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {`The document contains ${totalPages} pages and has an estimated file size of ${(totalPages * 0.7862).toFixed(2)} MB. All pages will be included by default. If you wish to download certain portions of it, you may provide a single page (e.g. 5) or a range (e.g. 5-10).`}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {`You can download up to ${maxPages} pages per request. For larger documents, please request several smaller ranges (e.g. 1-${maxPages}, then ${maxPages + 1}-${maxPages * 2}).`}
        </Typography>
        <TextField
          id="pdf-pages-input"
          label="Pages"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleDownload(); }}
          error={!validity.valid}
          helperText={validity.valid
            ? `Enter a page number or range (e.g. 5 or 5-10). Max ${maxPages} pages per request.`
            : validity.message}
          fullWidth
          margin="normal"
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
        <Button onClick={handleDownload} color="primary" variant="contained" disabled={!validity.valid}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default {
  target: 'Window',
  mode: 'add',
  name: 'MiradorPdfDialog',
  component: MiradorPdfDialog,
  mapStateToProps,
  mapDispatchToProps,
};
