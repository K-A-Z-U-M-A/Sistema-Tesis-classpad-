import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007AFF', // Azul Apple
      light: '#4DA3FF',
      dark: '#0056CC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#34C759', // Verde Apple
      light: '#6DDC8C',
      dark: '#28A745',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF3B30', // Rojo Apple
      light: '#FF6B5E',
      dark: '#CC2E26',
    },
    warning: {
      main: '#FF9500', // Naranja Apple
      light: '#FFB340',
      dark: '#CC7700',
    },
    info: {
      main: '#5AC8FA', // Azul claro Apple
      light: '#8DDDFF',
      dark: '#47A0C7',
    },
    success: {
      main: '#34C759', // Verde Apple
      light: '#6DDC8C',
      dark: '#28A745',
    },
    background: {
      default: '#F2F2F7', // Gris claro Apple
      paper: '#FFFFFF',
    },
    surface: {
      main: '#FFFFFF',
      secondary: '#F2F2F7',
      tertiary: '#E5E5EA',
    },
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      disabled: '#C7C7CC',
    },
    divider: '#C6C6C8',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '1rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 12, // Bordes redondeados estilo Apple
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
    '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
    '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
    '0px 14px 28px rgba(0, 0, 0, 0.25), 0px 10px 10px rgba(0, 0, 0, 0.22)',
    '0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)',
    '0px 24px 48px rgba(0, 0, 0, 0.35), 0px 18px 14px rgba(0, 0, 0, 0.22)',
    '0px 29px 58px rgba(0, 0, 0, 0.40), 0px 21px 16px rgba(0, 0, 0, 0.22)',
    '0px 34px 68px rgba(0, 0, 0, 0.45), 0px 24px 18px rgba(0, 0, 0, 0.22)',
    '0px 39px 78px rgba(0, 0, 0, 0.50), 0px 27px 20px rgba(0, 0, 0, 0.22)',
    '0px 44px 88px rgba(0, 0, 0, 0.55), 0px 30px 22px rgba(0, 0, 0, 0.22)',
    '0px 49px 98px rgba(0, 0, 0, 0.60), 0px 33px 24px rgba(0, 0, 0, 0.22)',
    '0px 54px 108px rgba(0, 0, 0, 0.65), 0px 36px 26px rgba(0, 0, 0, 0.22)',
    '0px 59px 118px rgba(0, 0, 0, 0.70), 0px 39px 28px rgba(0, 0, 0, 0.22)',
    '0px 64px 128px rgba(0, 0, 0, 0.75), 0px 42px 30px rgba(0, 0, 0, 0.22)',
    '0px 69px 138px rgba(0, 0, 0, 0.80), 0px 45px 32px rgba(0, 0, 0, 0.22)',
    '0px 74px 148px rgba(0, 0, 0, 0.85), 0px 48px 34px rgba(0, 0, 0, 0.22)',
    '0px 79px 158px rgba(0, 0, 0, 0.90), 0px 51px 36px rgba(0, 0, 0, 0.22)',
    '0px 84px 168px rgba(0, 0, 0, 0.95), 0px 54px 38px rgba(0, 0, 0, 0.22)',
    '0px 89px 178px rgba(0, 0, 0, 1.00), 0px 57px 40px rgba(0, 0, 0, 0.22)',
    '0px 94px 188px rgba(0, 0, 0, 1.00), 0px 60px 42px rgba(0, 0, 0, 0.22)',
    '0px 99px 198px rgba(0, 0, 0, 1.00), 0px 63px 44px rgba(0, 0, 0, 0.22)',
    '0px 104px 208px rgba(0, 0, 0, 1.00), 0px 66px 46px rgba(0, 0, 0, 0.22)',
    '0px 109px 218px rgba(0, 0, 0, 1.00), 0px 69px 48px rgba(0, 0, 0, 0.22)',
    '0px 114px 228px rgba(0, 0, 0, 1.00), 0px 72px 50px rgba(0, 0, 0, 0.22)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#007AFF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#007AFF',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          backgroundColor: '#007AFF',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0056CC',
            transform: 'scale(1.1)',
          },
        },
      },
    },
  },
});
