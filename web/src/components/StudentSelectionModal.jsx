import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Box,
  Typography,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search,
  Person
} from '@mui/icons-material';

const StudentSelectionModal = ({ 
  open, 
  onClose, 
  students = [], 
  selectedStudentIds = [], 
  onConfirm 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState(selectedStudentIds);

  // Actualizar selección local cuando cambian las props
  React.useEffect(() => {
    setLocalSelectedIds(selectedStudentIds);
  }, [selectedStudentIds, open]);

  // Ordenar y filtrar estudiantes
  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const name = (student.display_name || student.name || student.email || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });

    // Ordenar alfabéticamente por nombre
    return filtered.sort((a, b) => {
      const nameA = (a.display_name || a.name || a.email || '').toLowerCase();
      const nameB = (b.display_name || b.name || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [students, searchTerm]);

  const handleToggle = (studentId) => {
    setLocalSelectedIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (localSelectedIds.length === filteredAndSortedStudents.length) {
      setLocalSelectedIds([]);
    } else {
      setLocalSelectedIds(filteredAndSortedStudents.map(s => s.id));
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedStudentIds); // Resetear a los valores originales
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
      sx={{
        zIndex: 1400 // Asegurar que esté por encima de otros dialogs
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Seleccionar Alumnos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {localSelectedIds.length} de {students.length} seleccionados
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Campo de búsqueda */}
        <TextField
          fullWidth
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Botón seleccionar todos */}
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            onClick={handleSelectAll}
            disabled={filteredAndSortedStudents.length === 0}
          >
            {localSelectedIds.length === filteredAndSortedStudents.length && filteredAndSortedStudents.length > 0
              ? 'Deseleccionar todos'
              : 'Seleccionar todos'}
          </Button>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Lista de estudiantes */}
        {filteredAndSortedStudents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No se encontraron alumnos' : 'No hay alumnos disponibles'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredAndSortedStudents.map((student) => {
              const studentId = student.id;
              const isSelected = localSelectedIds.includes(studentId);
              const displayName = student.display_name || student.name || student.email || 'Sin nombre';

              return (
                <ListItem
                  key={studentId}
                  disablePadding
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={isSelected}
                      onChange={() => handleToggle(studentId)}
                    />
                  }
                >
                  <ListItemButton onClick={() => handleToggle(studentId)}>
                    <ListItemText
                      primary={displayName}
                      secondary={student.email && student.email !== displayName ? student.email : null}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={localSelectedIds.length === 0}
        >
          Confirmar ({localSelectedIds.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentSelectionModal;

