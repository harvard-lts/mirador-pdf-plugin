import { useState, useEffect } from 'react';
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

const MiradorPdfDialog = ({ open = false, closeDialog, manifestId, totalPages, pdfAPI, containerId = null }) => {
  const [pages, setPages] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setPages('');
      setError('');
    }
  }, [open]);

  const handleClose = () => {
    closeDialog();
    setPages('');
    setError('');
  };

  const validate = () => {
    if (pages === '') return true;

    const singlePattern = /^\d+$/;
    const rangePattern = /^(\d+)-(\d+)$/;

    if (singlePattern.test(pages)) {
      const num = parseInt(pages, 10);
      if (num < 1 || num > totalPages) {
        setError(`Page must be between 1 and ${totalPages}.`);
        return false;
      }
      return true;
    }

    const rangeMatch = pages.match(rangePattern);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start < 1 || end > totalPages) {
        setError(`Page range must be between 1 and ${totalPages}.`);
        return false;
      }
      if (start >= end) {
        setError('Start page must be less than end page.');
        return false;
      }
      return true;
    }

    setError('Please enter a page number or range (e.g. 5 or 5-10).');
    return false;
  };

  const handleDownload = () => {
    setError('');
    if (!validate()) return;

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
      <DialogTitle sx={{ paddingBottom: 0 }}>
        PDF Download
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {`The document contains ${totalPages} pages and has an estimated file size of ${(totalPages * 0.7862).toFixed(2)} MB. All pages will be included by default. If you wish to download certain portions of it, you may provide a comma separated list of pages and/or ranges.`}
        </Typography>
        <TextField
          id="pdf-pages-input"
          label="Pages"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleDownload(); }}
          error={Boolean(error)}
          helperText={error || `Enter a page number or range (e.g. 5 or 5-10). Max: ${totalPages}`}
          fullWidth
          margin="normal"
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
        <Button onClick={handleDownload} color="primary" variant="contained">
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
