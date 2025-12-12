import React from 'react';
import { Box, Typography, Button, Container, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <ErrorOutlineIcon sx={{ fontSize: 100, color: theme.palette.error.main, mb: 2 }} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <Typography variant="h1" component="h1" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
                    404
                </Typography>
                <Typography variant="h4" component="h2" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                    Página no encontrada
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px', mx: 'auto', color: theme.palette.text.secondary }}>
                    Lo sentimos, la página que buscas no existe o ha sido movida. Verifica la URL o regresa al inicio.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                        borderRadius: '28px',
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1.1rem'
                    }}
                >
                    Volver al Inicio
                </Button>
            </motion.div>
        </Container>
    );
};

export default NotFound;
