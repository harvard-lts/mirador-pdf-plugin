import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { getManifestoInstance } from 'mirador/dist/es/src/state/selectors/manifests';
import PDFIcon from "@material-ui/icons/PictureAsPdf";

const dialogReducer = (state = {}, action) => {
  if (action.type === 'OPEN_WINDOW_DIALOG') {
    return {
      ...state,
      [action.windowId]: {
        openDialog: action.dialogType,
      },
    };
  }
  if (action.type === 'CLOSE_WINDOW_DIALOG') {
    return {
      ...state,
      [action.windowId]: {
        openDialog: null,
      },
    };
  }
  return state;
};

const mapStateToProps = (state, { windowId }) => {
  const manifest = getManifestoInstance(state, { windowId });
  return {
    manifestId: (manifest || {}).id,
    totalPages: manifest ? (manifest.getSequences()[0]?.getTotalCanvases() || 0) : 0,
    pdfAPI: state.config?.miradorPdfPlugin?.pdfAPI,
  };
};

const mapDispatchToProps = (dispatch, { windowId }) => ({
  openDialog: () =>
    dispatch({ type: 'OPEN_WINDOW_DIALOG', windowId, dialogType: 'PDF_DOWNLOAD' }),
});

const MiradorPdfMenuItem = ({ handleClose, openDialog }) => {
  const handleClick = () => {
    openDialog();
    handleClose();
  };

  return (
    <div>
      <MenuItem onClick={handleClick}>
        <ListItemIcon>
          <PDFIcon />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: "body1" }}>      
          Download PDF
        </ListItemText>  
      </MenuItem>
    </div>
  );
};

MiradorPdfMenuItem.defaultProps = {
  handleClose: () => {},
  openDialog: () => {},
};

export default {
  target: 'WindowTopBarPluginMenu',
  mode: 'add',
  name: 'MiradorPdfMenuItem',
  component: MiradorPdfMenuItem,
  mapStateToProps,
  mapDispatchToProps,
  reducers: {
    windowDialogs: dialogReducer,
  },
};
