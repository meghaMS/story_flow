import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0052CC',
      light: '#2684FF',
      dark: '#0747A6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00875A',
      light: '#36B37E',
      dark: '#006644',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DE350B',
      light: '#FF5630',
      dark: '#BF2600',
    },
    warning: {
      main: '#FF8B00',
      light: '#FFAB00',
      dark: '#FF5630',
    },
    success: {
      main: '#00875A',
      light: '#36B37E',
      dark: '#006644',
    },
    info: {
      main: '#0065FF',
      light: '#2684FF',
      dark: '#0052CC',
    },
    background: {
      default: '#F4F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#172B4D',
      secondary: '#5E6C84',
    },
    divider: '#DFE1E6',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600 },
    body2: { lineHeight: 1.6 },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 3,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)',
          '&:hover': {
            boxShadow: '0 4px 8px -2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 3, fontWeight: 600, fontSize: '0.7rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)',
        },
      },
    },
  },
});
