import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
// @ts-ignore - JS theme module without TS types
import { createClasspadTheme } from '../theme';

interface ThemeContextType {
  mode: 'light' | 'dark';
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
};

// Aliases para evitar errores de importación y máxima compatibilidad
export const useThemeToggle = useThemeMode;
export const useColorMode = useThemeMode;
export const useTheme = useThemeMode;

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  // Leer el tema guardado en localStorage o usar el del sistema
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('classpad-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Persistir en localStorage y aplicar al documento HTML
  useEffect(() => {
    localStorage.setItem('classpad-theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Generar tema MUI según el modo actual
  const muiTheme = useMemo(() => createClasspadTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, theme: mode, toggleTheme, setMode }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
