import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { getManifestoInstance } from 'mirador/dist/es/src/state/selectors/manifests';

const mapStateToProps = (state, { windowId }) => {
  const manifest = getManifestoInstance(state, { windowId });
  return {
    manifestId: (manifest || {}).id,
    totalPages: manifest ? (manifest.getSequences()[0]?.getTotalCanvases() || 0) : 0,
    pdfAPI: state.config?.miradorPdfPlugin?.pdfAPI,
  };
};

const MiradorPdfPlugin = ({ manifestId, totalPages, pdfAPI, handleMenuItemClick }) => {
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState('');
  const [error, setError] = useState('');

  const handleOpen = () => {
    if (handleMenuItemClick) handleMenuItemClick();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setPages('');
    setError('');
  };

  return (
    <>
      <MenuItem onClick={handleOpen}>
        Download PDF
      </MenuItem>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>PDF Download</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Use the field below to optionally
            specify a page or range of pages to include in your PDF download.
          </Typography>
          <TextField
            label="Pages"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            error={Boolean(error)}
            helperText={error || `Enter a page number (e.g. 5) or range (e.g. 5-10). Max: ${totalPages}`}
            fullWidth
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="default">
            Close
          </Button>
          <Button onClick={() => {}} color="primary" variant="contained">
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default {
  target: 'WindowTopBarPluginMenu',
  mode: 'add',
  component: MiradorPdfPlugin,
  mapStateToProps,
};
