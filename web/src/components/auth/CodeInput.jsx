/**
 * CodeInput - Componente para ingresar código de 6 dígitos
 * 
 * Características:
 * - 6 inputs individuales
 * - Auto-focus en siguiente input
 * - Permite pegar código completo
 * - Validación de solo números
 * - Diseño Material-UI
 */

import React, { useRef, useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const CodeInput = ({ value = '', onChange, error = false, disabled = false }) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    // Inicializar refs
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 6);
    }, []);

    // Sincronizar con prop value
    useEffect(() => {
        if (value && value.length === 6) {
            setCode(value.split(''));
        }
    }, [value]);

    // Notificar cambios al padre
    useEffect(() => {
        const fullCode = code.join('');
        if (onChange && fullCode !== value) {
            onChange(fullCode);
        }
    }, [code]);

    /**
     * Manejar cambio en un input
     */
    const handleChange = (index, newValue) => {
        // Solo permitir números
        const sanitized = newValue.replace(/[^0-9]/g, '');

        if (sanitized.length === 0) {
            // Borrar
            const newCode = [...code];
            newCode[index] = '';
            setCode(newCode);
            return;
        }

        if (sanitized.length === 1) {
            // Un solo dígito
            const newCode = [...code];
            newCode[index] = sanitized;
            setCode(newCode);

            // Auto-focus en siguiente input
            if (index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (sanitized.length === 6) {
            // Código completo pegado
            setCode(sanitized.split(''));
            // Focus en último input
            inputRefs.current[5]?.focus();
        }
    };

    /**
     * Manejar tecla presionada
     */
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            // Si está vacío y presiona backspace, ir al anterior
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    /**
     * Manejar paste
     */
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const sanitized = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

        if (sanitized.length === 6) {
            setCode(sanitized.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    /**
     * Manejar focus
     */
    const handleFocus = (index) => {
        // Seleccionar todo el contenido al hacer focus
        inputRefs.current[index]?.select();
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box
                sx={{
                    display: 'flex',
                    gap: { xs: 1, sm: 2 },
                    justifyContent: 'center',
                    mb: error ? 1 : 0
                }}
            >
                {code.map((digit, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <TextField
                            inputRef={(el) => (inputRefs.current[index] = el)}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            onFocus={() => handleFocus(index)}
                            disabled={disabled}
                            error={error}
                            inputProps={{
                                maxLength: 1,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    padding: '12px 0'
                                },
                                inputMode: 'numeric',
                                pattern: '[0-9]*'
                            }}
                            sx={{
                                width: { xs: 40, sm: 50 },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&.Mui-focused fieldset': {
                                        borderWidth: 2,
                                        borderColor: error ? 'error.main' : 'primary.main'
                                    },
                                    '&.Mui-error fieldset': {
                                        borderColor: 'error.main'
                                    }
                                },
                                '& input': {
                                    cursor: 'text'
                                }
                            }}
                        />
                    </motion.div>
                ))}
            </Box>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Typography
                        variant="caption"
                        color="error"
                        sx={{
                            display: 'block',
                            textAlign: 'center',
                            mt: 1
                        }}
                    >
                        Código incorrecto. Por favor, verifica e intenta de nuevo.
                    </Typography>
                </motion.div>
            )}
        </Box>
    );
};

export default CodeInput;
