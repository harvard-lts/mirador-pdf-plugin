import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { getManifestoInstance } from 'mirador/dist/es/src/state/selectors/manifests';

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

const MiradorPdfDialog = ({ open, closeDialog, manifestId, totalPages, pdfAPI, containerId, classes }) => {
  const [pages, setPages] = useState('');
  const [error, setError] = useState('');

  // Reset form state whenever the dialog is closed
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
        <DialogTitle disableTypography className={classes.h2}>
          <Typography variant="h2">PDF Download</Typography>
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
        <Button onClick={handleClose} color="default">
          Close
        </Button>
        <Button onClick={handleDownload} color="primary" variant="contained">
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MiradorPdfDialog.defaultProps = {
  open: false,
  containerId: null,
};

const styles = () => ({
  h2: {
    paddingBottom: 0,
  },
});

export default {
  target: 'Window',
  mode: 'add',
  name: 'MiradorPdfDialog',
  component: withStyles(styles)(MiradorPdfDialog),
  mapStateToProps,
  mapDispatchToProps,
};
