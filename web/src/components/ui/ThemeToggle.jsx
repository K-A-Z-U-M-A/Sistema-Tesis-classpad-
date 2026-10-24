import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useThemeToggle } from '../../contexts/ThemeContext';

/**
 * Botón para alternar entre tema claro y oscuro.
 * Consume el ThemeContext para cambiar el modo de la aplicación.
 */
const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeToggle();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
      <IconButton
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        sx={{
          p: 1,
          color: 'inherit',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'rotate(15deg)',
          },
        }}
      >
        {isDark ? (
          <LightModeOutlinedIcon sx={{ fontSize: 22, color: '#FDB813' }} />
        ) : (
          <DarkModeOutlinedIcon sx={{ fontSize: 22 }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;