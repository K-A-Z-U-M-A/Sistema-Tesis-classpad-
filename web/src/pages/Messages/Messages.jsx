import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function Messages() {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
        Mensajes
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Página de Mensajes en Desarrollo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Aquí se mostrarán los mensajes y anuncios del curso
        </Typography>
      </Paper>
    </Box>
  );
}
