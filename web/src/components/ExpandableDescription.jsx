import React, { useState } from 'react';
import {
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

const ExpandableDescription = ({ 
  description, 
  maxLength = 150,
  showExpandButton = true,
  sx = {},
  variant = 'body2',
  color = 'text.secondary'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Si no hay descripción, no renderizar nada
  if (!description || description.trim() === '') {
    return null;
  }

  // Ajustar longitud máxima para móviles
  const adjustedMaxLength = isMobile ? Math.floor(maxLength * 0.8) : maxLength;
  const shouldTruncate = description.length > adjustedMaxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? description 
    : `${description.substring(0, adjustedMaxLength)}...`;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box sx={{ ...sx }}>
      <Typography
        variant={variant}
        color={color}
        sx={{
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          lineHeight: 1.5,
          whiteSpace: 'pre-line', // Respeta saltos de línea
          wordBreak: 'break-word', // Rompe palabras largas
          mb: showExpandButton && shouldTruncate ? 1 : 0
        }}
      >
        {displayText}
      </Typography>
      
      {showExpandButton && shouldTruncate && (
        <Button
          size="small"
          onClick={toggleExpanded}
          startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
          sx={{
            minWidth: 'auto',
            p: 0.5,
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            color: theme.palette.primary.main,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </Button>
      )}
    </Box>
  );
};

export default ExpandableDescription;
