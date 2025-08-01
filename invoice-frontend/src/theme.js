import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#274472', // rich blue
      light: '#4B6C9E',
      dark: '#1B2A41',
      contrastText: '#F5F6FA',
    },
    secondary: {
      main: '#C3B091', // muted gold/bronze
      light: '#E6D3B3',
      dark: '#A68A64',
      contrastText: '#23272F',
    },
    background: {
      default: '#23272F', // deep navy/charcoal
      paper: '#F5F6FA', // ivory/off-white
    },
    text: {
      primary: '#23272F', // dark text
      secondary: '#274472', // blue text
      disabled: '#A68A64', // muted gold for disabled
    },
    divider: 'rgba(39, 44, 51, 0.15)',
    success: {
      main: '#2E8B57', // classic green
    },
    warning: {
      main: '#C3B091', // gold
    },
    error: {
      main: '#8B0000', // burgundy
    },
    grey: {
      100: '#ECECEC',
      200: '#B0B8C1',
      800: '#23272F',
    },
  },
  typography: {
    fontFamily: 'Georgia, Times New Roman, serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#F5F6FA',
          color: '#23272F',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(39, 44, 51, 0.10)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#F5F6FA',
          color: '#23272F',
          borderRadius: 18,
          boxShadow: '0 8px 32px rgba(39, 44, 51, 0.10)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          background: 'linear-gradient(90deg, #274472 0%, #C3B091 100%)',
          color: '#F5F6FA',
          boxShadow: '0 2px 8px rgba(39, 44, 51, 0.10)',
          '&:hover': {
            background: 'linear-gradient(90deg, #1B2A41 0%, #A68A64 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: '#C3B091',
          color: '#23272F',
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(39, 44, 51, 0.10)',
        },
        head: {
          color: '#274472',
          fontWeight: 700,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#F5F6FA',
          color: '#23272F',
        },
      },
    },
  },
});

export default theme; 