import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import miradorPdfMenuItem from '../plugins/MiradorPdfMenuItem';
import miradorPdfDialog, { extractUrn } from '../plugins/MiradorPdfDialog';

const MiradorPdfMenuItem = miradorPdfMenuItem.component;
const MiradorPdfDialog = miradorPdfDialog.component;

const MANIFEST_ID = 'https://nrs-dev.lib.harvard.edu/URN-3:RAD.SCHL:101118966:MANIFEST:3';
const PDF_API = 'http://mps-dev.lib.harvard.edu/pdf/download/';
const EXPECTED_URN = 'URN-3:RAD.SCHL:101118966';

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(window, 'open').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// extractUrn helper
// ---------------------------------------------------------------------------

describe('extractUrn', () => {
  it('extracts the URN portion from a full manifest URL', () => {
    expect(extractUrn(MANIFEST_ID)).toBe(EXPECTED_URN);
  });

  it('handles a manifest URL without a :MANIFEST suffix', () => {
    expect(extractUrn('https://example.com/URN-3:FOO:BAR')).toBe('URN-3:FOO:BAR');
  });

  it('strips the leading slash from the pathname', () => {
    const result = extractUrn('https://example.com/some-urn:MANIFEST:1');
    expect(result.startsWith('/')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MiradorPdfMenuItem
// ---------------------------------------------------------------------------

describe('MiradorPdfMenuItem', () => {
  const handleClose = vi.fn();
  const openDialog = vi.fn();

  beforeEach(() => {
    handleClose.mockClear();
    openDialog.mockClear();
  });

  const renderMenuItem = (props = {}) =>
    render(
      <MiradorPdfMenuItem
        handleClose={handleClose}
        openDialog={openDialog}
        {...props}
      />
    );

  it('renders with "Download PDF" text', () => {
    renderMenuItem();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('calls openDialog when clicked', () => {
    renderMenuItem();
    fireEvent.click(screen.getByText('Download PDF'));
    expect(openDialog).toHaveBeenCalledTimes(1);
  });

  it('calls handleClose when clicked', () => {
    renderMenuItem();
    fireEvent.click(screen.getByText('Download PDF'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('targets WindowTopBarPluginMenu', () => {
    expect(miradorPdfMenuItem.target).toBe('WindowTopBarPluginMenu');
  });

  it('uses mode "add"', () => {
    expect(miradorPdfMenuItem.mode).toBe('add');
  });

  it('exports a dialogReducer via reducers.windowDialogs', () => {
    expect(typeof miradorPdfMenuItem.reducers.windowDialogs).toBe('function');
  });

  it('dialogReducer handles OPEN_WINDOW_DIALOG', () => {
    const reducer = miradorPdfMenuItem.reducers.windowDialogs;
    const state = reducer({}, { type: 'OPEN_WINDOW_DIALOG', windowId: 'w1', dialogType: 'PDF_DOWNLOAD' });
    expect(state.w1.openDialog).toBe('PDF_DOWNLOAD');
  });

  it('dialogReducer handles CLOSE_WINDOW_DIALOG', () => {
    const reducer = miradorPdfMenuItem.reducers.windowDialogs;
    const state = reducer(
      { w1: { openDialog: 'PDF_DOWNLOAD' } },
      { type: 'CLOSE_WINDOW_DIALOG', windowId: 'w1' }
    );
    expect(state.w1.openDialog).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// MiradorPdfDialog — helpers
// ---------------------------------------------------------------------------

const dialogDefaultProps = {
  open: true,
  manifestId: MANIFEST_ID,
  totalPages: 100,
  pdfAPI: PDF_API,
  containerId: null,
  closeDialog: vi.fn(),
};

const renderDialog = (props = {}) =>
  render(<MiradorPdfDialog {...dialogDefaultProps} {...props} />);

// ---------------------------------------------------------------------------
// MiradorPdfDialog — structure
// ---------------------------------------------------------------------------

describe('MiradorPdfDialog > structure', () => {
  it('renders nothing when open is false', () => {
    const { container } = renderDialog({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it('displays the title "PDF Download"', () => {
    renderDialog();
    expect(screen.getByText('PDF Download')).toBeInTheDocument();
  });

  it('renders the Pages text field', () => {
    renderDialog();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders Download and Close buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MiradorPdfDialog — close behaviour
// ---------------------------------------------------------------------------

describe('MiradorPdfDialog > Close button', () => {
  it('calls closeDialog when Close is clicked', () => {
    const closeDialog = vi.fn();
    renderDialog({ closeDialog });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it('resets the Pages field and any error after close and reopen', () => {
    const { rerender } = renderDialog();

    // Type something invalid to trigger an error
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText(/Please enter a page number or range/)).toBeInTheDocument();

    // Simulate Redux closing then reopening the dialog
    rerender(<MiradorPdfDialog {...dialogDefaultProps} open={false} closeDialog={vi.fn()} />);
    rerender(<MiradorPdfDialog {...dialogDefaultProps} open={true} closeDialog={vi.fn()} />);

    expect(screen.getByRole('textbox').value).toBe('');
    expect(screen.queryByText(/Please enter a page number or range/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MiradorPdfDialog — validation
// ---------------------------------------------------------------------------

describe('MiradorPdfDialog > validation', () => {
  beforeEach(() => {
    renderDialog({ totalPages: 50 });
  });

  it('shows an error for non-numeric, non-range input', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText(/Please enter a page number or range/)).toBeInTheDocument();
  });

  it('shows an error for special characters', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText(/Please enter a page number or range/)).toBeInTheDocument();
  });

  it('shows an error when single page exceeds totalPages', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '51' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText(/Page must be between 1 and 50/)).toBeInTheDocument();
  });

  it('shows an error when range end exceeds totalPages', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5-55' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText(/Page range must be between 1 and 50/)).toBeInTheDocument();
  });

  it('shows an error when range start is not less than end', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '10-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText(/Start page must be less than end page/)).toBeInTheDocument();
  });

  it('does not call window.open when validation fails', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(window.open).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// MiradorPdfDialog — download URL construction
// ---------------------------------------------------------------------------

describe('MiradorPdfDialog > download URL construction', () => {
  const baseUrl = `${PDF_API.replace(/\/$/, '')}/${EXPECTED_URN}`;

  beforeEach(() => {
    renderDialog();
  });

  it('opens the base URL with no query params when Pages is empty', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(window.open).toHaveBeenCalledWith(baseUrl, '_blank');
  });

  it('appends ?page=N for a valid single page number', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(window.open).toHaveBeenCalledWith(`${baseUrl}?page=5`, '_blank');
  });

  it('appends ?start=N&end=M for a valid page range', () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(window.open).toHaveBeenCalledWith(`${baseUrl}?start=5&end=10`, '_blank');
  });

  it('calls closeDialog after a successful download', () => {
    const closeDialog = vi.fn();
    render(<MiradorPdfDialog {...dialogDefaultProps} closeDialog={closeDialog} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });

  it('works with a pdfAPI value that has no trailing slash', () => {
    render(
      <MiradorPdfDialog
        {...dialogDefaultProps}
        pdfAPI="http://mps-dev.lib.harvard.edu/pdf/download"
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    expect(window.open).toHaveBeenCalledWith(
      `http://mps-dev.lib.harvard.edu/pdf/download/${EXPECTED_URN}`,
      '_blank'
    );
  });
});

// ---------------------------------------------------------------------------
// MiradorPdfDialog — plugin shape
// ---------------------------------------------------------------------------

describe('MiradorPdfDialog > plugin export', () => {
  it('targets Window', () => {
    expect(miradorPdfDialog.target).toBe('Window');
  });

  it('uses mode "add"', () => {
    expect(miradorPdfDialog.mode).toBe('add');
  });

  it('exports a mapStateToProps function', () => {
    expect(typeof miradorPdfDialog.mapStateToProps).toBe('function');
  });

  it('exports a mapDispatchToProps function', () => {
    expect(typeof miradorPdfDialog.mapDispatchToProps).toBe('function');
  });
});

