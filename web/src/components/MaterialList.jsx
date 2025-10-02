import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import {
  AttachFile,
  Link,
  Image,
  VideoLibrary,
  Audiotrack,
  Download,
  Delete
} from '@mui/icons-material';
import api from '../services/api';

const MaterialList = ({ 
  materials = [], 
  showDelete = false, 
  onDelete = null,
  emptyMessage = "No hay materiales",
  title = "Materiales"
}) => {
  const downloadFile = (material) => {
    if (material.type === 'link') {
      // For links, open in new tab
      window.open(material.url, '_blank');
      return;
    }

    // For files, download directly
    const link = document.createElement('a');
    link.href = material.url;
    link.download = material.file_name || material.title || 'archivo';
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getMaterialIcon = (type) => {
    switch (type) {
      case 'document':
        return <AttachFile />;
      case 'link':
        return <Link />;
      case 'image':
        return <Image />;
      case 'video':
        return <VideoLibrary />;
      case 'audio':
        return <Audiotrack />;
      default:
        return <AttachFile />;
    }
  };

  const getMaterialColor = (type) => {
    switch (type) {
      case 'document':
        return 'primary.main';
      case 'link':
        return 'secondary.main';
      case 'image':
        return 'success.main';
      case 'video':
        return 'error.main';
      case 'audio':
        return 'warning.main';
      default:
        return 'primary.main';
    }
  };

  if (materials.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AttachFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {materials.map((material, index) => (
        <React.Fragment key={material.id}>
          <ListItem
            onClick={() => downloadFile(material)}
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              mb: 0.5,
              '&:hover': { 
                backgroundColor: 'action.hover',
                '& .MuiListItemText-primary': { color: 'primary.main' }
              }
            }}
            secondaryAction={showDelete && onDelete && (
              <IconButton
                edge="end"
                aria-label="delete"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(material.id);
                }}
              >
                <Delete />
              </IconButton>
            )}
          >
            <ListItemAvatar>
              <Avatar sx={{ 
                bgcolor: getMaterialColor(material.type), 
                width: 40, 
                height: 40 
              }}>
                {getMaterialIcon(material.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight="medium">
                  {material.title || material.file_name}
                </Typography>
              }
              secondary="Click para abrir/descargar"
            />
          </ListItem>
          {index < materials.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default MaterialList;
