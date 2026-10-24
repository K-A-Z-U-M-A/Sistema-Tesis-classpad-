import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, IconButton,
  Chip, CircularProgress, Alert, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Tooltip, Badge, Paper,
  Skeleton, Fade, FormControl, InputLabel, Select, MenuItem,
  RadioGroup, FormControlLabel, Radio, Checkbox
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  EventBusy as HolidayIcon,
  CheckCircle as ClassDayIcon,
  BarChart as StatsIcon,
  Settings as SettingsIcon,
  ArrowBack as BackIcon,
  Today as TodayIcon,
  Save as SaveIcon,
  SwapHoriz as MoveIcon,
  MenuBook as TopicIcon,
  DeleteOutline as DeleteIcon,
  AssignmentTurnedIn as AssignedIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext.tsx';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: Roman Numerals & Class Generation
// ─────────────────────────────────────────────────────────────────────────────
const romanToNum = (roman) => {
  if (!roman) return 0;
  const romanMap = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let num = 0;
  let prevValue = 0;
  const upper = roman.toUpperCase().trim();
  for (let i = upper.length - 1; i >= 0; i--) {
    const currValue = romanMap[upper[i]] || 0;
    if (currValue < prevValue) {
      num -= currValue;
    } else {
      num += currValue;
    }
    prevValue = currValue;
  }
  return num;
};

const toRoman = (num) => {
  if (!num || num <= 0) return 'I';
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let n = num;
  for (const [val, roman] of map) {
    while (n >= val) {
      res += roman;
      n -= val;
    }
  }
  return res;
};

const getRomanClassesList = (count = 10) => {
  const list = [];
  for (let i = 1; i <= Math.max(count, 10); i++) {
    list.push(`Clase ${toRoman(i)}`);
  }
  return list;
};

const getNextClassTemplateName = (templates = []) => {
  let maxNum = 0;
  templates.forEach((name) => {
    const match = name?.match(/^Clase\s+([IVXLCDM]+)$/i);
    if (match) {
      const val = romanToNum(match[1]);
      if (val > maxNum) maxNum = val;
    }
  });

  let nextNum = maxNum > 0 ? maxNum + 1 : (templates.length + 1 || 1);
  let candidate = `Clase ${toRoman(nextNum)}`;
  while (templates.includes(candidate)) {
    nextNum++;
    candidate = `Clase ${toRoman(nextNum)}`;
  }
  return candidate;
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Add / Edit Class Template Dialog (From Sidebar)
// ─────────────────────────────────────────────────────────────────────────────
const AddEditClassTemplateDialog = ({ open, onClose, editingClassName, onSave }) => {
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (open) {
      setClassName(editingClassName || '');
    }
  }, [open, editingClassName]);

  const handleSubmit = () => {
    const trimmed = className.trim();
    if (!trimmed) {
      toast.error('Ingresa el nombre de la clase');
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TopicIcon color="primary" />
        {editingClassName ? 'Editar Nombre de la Clase' : 'Añadir Nueva Clase'}
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <TextField
          fullWidth
          label="Nombre de la Clase"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="Ej: Clase XI, Taller de Repaso..."
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Schedule Class / Unit Topic Dialog (For Calendar Dates)
// ─────────────────────────────────────────────────────────────────────────────
const ScheduleClassDialog = ({
  open,
  onClose,
  dateStr,
  scheduledClass,
  units = [],
  classTemplates = [],
  scheduledClassesMap = {},
  isTeacher,
  onSave,
  onDelete,
}) => {
  const [template, setTemplate] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      if (scheduledClass) {
        // Detectar IDs de unidades previas (array de IDs, assigned_units, o unit_id)
        let initialUnitIds = [];
        if (Array.isArray(scheduledClass.unit_ids) && scheduledClass.unit_ids.length > 0) {
          initialUnitIds = scheduledClass.unit_ids;
        } else if (Array.isArray(scheduledClass.assigned_units) && scheduledClass.assigned_units.length > 0) {
          initialUnitIds = scheduledClass.assigned_units.map((u) => u.id);
        } else if (scheduledClass.unit_id) {
          initialUnitIds = [scheduledClass.unit_id];
        }
        setSelectedUnitIds(initialUnitIds);
        setDescription(scheduledClass.description || '');

        // Detectar si el título coincide o comienza con alguna plantilla
        const matched = classTemplates.find((t) =>
          scheduledClass.title?.toLowerCase().startsWith(t.toLowerCase())
        );
        setTemplate(matched || scheduledClass.title?.split(':')[0]?.trim() || classTemplates[0] || 'Clase I');
      } else {
        // Sugerir la siguiente plantilla no asignada
        const firstUnused = classTemplates.find((t) => {
          return !Object.values(scheduledClassesMap || {}).some((sc) =>
            sc.title?.toLowerCase().startsWith(t.toLowerCase())
          );
        });
        setTemplate(firstUnused || classTemplates[0] || 'Clase I');
        setSelectedUnitIds([]);
        setDescription('');
      }
    }
  }, [open, scheduledClass, scheduledClassesMap, classTemplates]);

  const handleSave = async () => {
    const chosenUnits = units.filter((u) => selectedUnitIds.includes(u.id));
    const unitsCombinedTitle = chosenUnits.map((u) => u.title || u.name).join(' + ');

    if (!template) {
      toast.error('Selecciona la clase');
      return;
    }

    let finalTitle = template;
    if (template && unitsCombinedTitle) {
      finalTitle = `${template}: ${unitsCombinedTitle}`;
    } else if (unitsCombinedTitle) {
      finalTitle = unitsCombinedTitle;
    }

    setSaving(true);
    try {
      await onSave({
        class_date: dateStr,
        unit_id: selectedUnitIds[0] || null,
        unit_ids: selectedUnitIds,
        title: finalTitle,
        description: description.trim(),
      });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scheduledClass?.id) return;
    setDeleting(true);
    try {
      await onDelete(scheduledClass.id);
      onClose();
    } catch {
      // handled by parent
    } finally {
      setDeleting(false);
    }
  };

  const displayUnits = scheduledClass?.assigned_units && scheduledClass.assigned_units.length > 0
    ? scheduledClass.assigned_units
    : scheduledClass?.unit_ids && Array.isArray(scheduledClass.unit_ids)
    ? units.filter((u) => scheduledClass.unit_ids.includes(u.id))
    : units.filter((u) => u.id === scheduledClass?.unit_id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TopicIcon color="primary" />
        {isTeacher
          ? (scheduledClass ? 'Editar Clase Asignada' : 'Asignar Clase y Unidad(es) a esta Fecha')
          : 'Contenido de la Clase'}
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2.5}>
          <Chip label={`📅 Fecha: ${dateStr}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
          {scheduledClass && (
            <Chip label="Clase Cargada" size="small" color="success" sx={{ fontWeight: 600 }} />
          )}
        </Box>

        {isTeacher ? (
          <Box display="flex" flexDirection="column" gap={2.5}>
            {/* 1. Selector de Clase */}
            <FormControl fullWidth>
              <InputLabel id="select-template-label">Seleccionar Clase</InputLabel>
              <Select
                labelId="select-template-label"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                label="Seleccionar Clase"
              >
                {classTemplates.map((t) => {
                  const assignedTo = Object.values(scheduledClassesMap || {}).find(
                    (sc) => sc.title?.toLowerCase().startsWith(t.toLowerCase()) && sc.class_date?.split('T')[0] !== dateStr
                  );
                  const isCurrentDate = scheduledClass?.title?.toLowerCase().startsWith(t.toLowerCase());
                  const isLoaded = !!assignedTo || isCurrentDate;

                  return (
                    <MenuItem key={t} value={t} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Box component="span" fontWeight={700}>
                        {t}
                      </Box>
                      {isCurrentDate ? (
                        <Chip label="En esta fecha" size="small" color="primary" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                      ) : isLoaded ? (
                        <Chip label={`✅ Cargada (${assignedTo.class_date?.split('T')[0]})`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                      ) : (
                        <Chip label="⭕ Pendiente" size="small" color="default" sx={{ height: 20, fontSize: '0.68rem' }} />
                      )}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* 2. Selector Múltiple de Unidades del Curso */}
            {units.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel id="select-units-label">Asignar Unidad(es) del Curso</InputLabel>
                <Select
                  labelId="select-units-label"
                  multiple
                  value={selectedUnitIds}
                  onChange={(e) => {
                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                    setSelectedUnitIds(val);
                  }}
                  label="Asignar Unidad(es) del Curso"
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <em>— Sin unidades vinculadas (Solo {template || 'Clase'}) —</em>;
                    }
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((uId) => {
                          const uObj = units.find((u) => u.id === uId);
                          return (
                            <Chip
                              key={uId}
                              label={uObj ? `Unidad ${uObj.order_index ?? ''}: ${uObj.title || uObj.name}` : uId}
                              size="small"
                              color="secondary"
                              sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                            />
                          );
                        })}
                      </Box>
                    );
                  }}
                >
                  {units.map((u, i) => {
                    const isChecked = selectedUnitIds.includes(u.id);
                    return (
                      <MenuItem key={u.id} value={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox checked={isChecked} size="small" color="secondary" />
                        <Typography variant="body2">
                          <strong>Unidad {u.order_index ?? (i + 1)}:</strong>&nbsp;{u.title || u.name}
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ py: 0.5 }}>
                No hay unidades creadas en este curso. Se asignará únicamente como <strong>{template}</strong>.
              </Alert>
            )}

            {/* 3. Observación (Opcional) */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observación / Notas de la Clase (Opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Traer materiales para la clase práctica."
            />
          </Box>
        ) : (
          <Box py={1}>
            {scheduledClass ? (
              <>
                <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                  {scheduledClass.title}
                </Typography>
                {displayUnits.length > 0 && (
                  <Box display="flex" gap={0.75} flexWrap="wrap" mb={1.5}>
                    {displayUnits.map((u, idx) => (
                      <Chip
                        key={u.id || idx}
                        label={`Unidad: ${u.title || u.name}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
                {scheduledClass.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {scheduledClass.description}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay un tema específico asignado para esta fecha.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {isTeacher && scheduledClass ? (
          <Button
            color="error"
            onClick={handleDelete}
            disabled={deleting || saving}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Desasignar Fecha
          </Button>
        ) : <Box />}
        <Box display="flex" gap={1}>
          <Button onClick={onClose} disabled={saving || deleting}>
            {isTeacher ? 'Cancelar' : 'Cerrar'}
          </Button>
          {isTeacher && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || deleting}
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              Guardar Asignación
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Create Holiday / Asueto Dialog
// ─────────────────────────────────────────────────────────────────────────────
const CreateHolidayDialog = ({ open, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isNational, setIsNational] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsNational(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !date) {
      toast.error('Completa el nombre y la fecha del feriado');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        date,
        is_national: isNational,
      });
      onClose();
    } catch {
      // handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HolidayIcon color="error" />
        Nuevo Feriado o Asueto
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Nombre del Feriado / Asueto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Aniversario Universitario / Asueto"
          fullWidth
          required
        />
        <TextField
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          required
        />
        <FormControl fullWidth size="small">
          <InputLabel>Tipo de Feriado</InputLabel>
          <Select
            value={isNational ? 'national' : 'institutional'}
            onChange={(e) => setIsNational(e.target.value === 'national')}
            label="Tipo de Feriado"
          >
            <MenuItem value="institutional">Asueto Institucional / Local</MenuItem>
            <MenuItem value="national">Feriado Nacional</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {saving ? 'Guardando...' : 'Crear Feriado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAYS_OF_WEEK_LABELS = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const toDateStr = (date) => date.toISOString().split('T')[0];

const parseLocalDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const DAYS_OF_WEEK = [
  { key: 'monday',    label: 'Lun', fullName: 'Lunes',     disabled: false },
  { key: 'tuesday',   label: 'Mar', fullName: 'Martes',    disabled: false },
  { key: 'wednesday', label: 'Mié', fullName: 'Miércoles', disabled: false },
  { key: 'thursday',  label: 'Jue', fullName: 'Jueves',    disabled: false },
  { key: 'friday',    label: 'Vie', fullName: 'Viernes',   disabled: false },
  { key: 'saturday',  label: 'Sáb', fullName: 'Sábado',    disabled: true, reason: 'Fin de semana (no lectivo)' },
  { key: 'sunday',    label: 'Dom', fullName: 'Domingo',   disabled: true, reason: 'Fin de semana (no lectivo)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Config panel (date range and class days)
// ─────────────────────────────────────────────────────────────────────────────
const CalendarConfigDialog = ({ open, onClose, calendar, course, onSave }) => {
  const [startDate, setStartDate] = useState(calendar?.start_date?.split('T')[0] || '');
  const [endDate,   setEndDate]   = useState(calendar?.end_date?.split('T')[0] || '');
  const [notes,     setNotes]     = useState(calendar?.notes || '');
  const [classDays, setClassDays] = useState(course?.class_days || []);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate(calendar?.start_date?.split('T')[0] || '');
      setEndDate(calendar?.end_date?.split('T')[0] || '');
      setNotes(calendar?.notes || '');
      setClassDays(course?.class_days || []);
    }
  }, [open, calendar, course]);

  const toggleDay = (day) => {
    if (day.disabled) return;
    setClassDays((prev) =>
      prev.includes(day.key)
        ? prev.filter((k) => k !== day.key)
        : [...prev, day.key]
    );
  };

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast.error('Debes especificar fecha de inicio y fin del semestre');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('La fecha de fin debe ser posterior al inicio');
      return;
    }
    if (classDays.length === 0) {
      toast.error('Selecciona al menos un día de la semana para las clases');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        start_date: startDate,
        end_date: endDate,
        notes,
        class_days: classDays,
      });
      onClose();
    } catch {
      /* toast shown by parent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Configurar Período y Días de Clase
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Configura los días de la semana en que se imparten las clases y las fechas del semestre.
          El calendario marcará automáticamente los días correspondientes.
        </Typography>

        {/* Selector de días de la semana */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Typography variant="subtitle2" fontWeight={700}>
              Días de clase en la semana:
            </Typography>
            <Chip
              label={`${classDays.length} seleccionado(s)`}
              size="small"
              color={classDays.length > 0 ? 'primary' : 'default'}
            />
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = classDays.includes(day.key);
              if (day.disabled) {
                return (
                  <Tooltip key={day.key} title={day.reason || 'No lectivo'} arrow>
                    <span>
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          userSelect: 'none',
                          border: '1px dashed',
                          borderColor: 'divider',
                          backgroundColor: 'action.disabledBackground',
                          color: 'text.disabled',
                          cursor: 'not-allowed',
                          opacity: 0.5,
                        }}
                      >
                        {day.label}
                      </Box>
                    </span>
                  </Tooltip>
                );
              }

              return (
                <Box
                  key={day.key}
                  onClick={() => toggleDay(day)}
                  sx={{
                    px: 2.2,
                    py: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    userSelect: 'none',
                    transition: 'all 0.18s ease-in-out',
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    backgroundColor: isSelected ? 'primary.main' : 'background.paper',
                    color: isSelected ? '#fff' : 'text.primary',
                    boxShadow: isSelected ? 2 : 0,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {day.label}
                </Box>
              );
            })}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            * Sábado y Domingo están deshabilitados (fines de semana no lectivos).
          </Typography>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
          Rango del Semestre:
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" label="Inicio del semestre" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" label="Fin del semestre" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Notas o período lectivo (opcional)" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Semestre 1 de 2026 — Clases presenciales" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Move holiday dialog
// ─────────────────────────────────────────────────────────────────────────────
const MoveHolidayDialog = ({ open, holiday, onClose, onSave }) => {
  const [newDate,  setNewDate]  = useState('');
  const [reason,   setReason]   = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (open && holiday) {
      setNewDate(holiday.effective_date?.split('T')[0] || '');
      setReason(holiday.move_reason || '');
    }
  }, [open, holiday]);

  const handleSave = async () => {
    if (!newDate) { toast.error('Selecciona la nueva fecha'); return; }
    setSaving(true);
    try {
      await onSave(holiday.id, { effective_date: newDate, move_reason: reason });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoveIcon color="warning" />
        Mover Feriado
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {holiday && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>{holiday.name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Fecha original: {holiday.original_date?.split('T')[0]}
            </Typography>
            <TextField fullWidth type="date" label="Nueva fecha efectiva" value={newDate}
              onChange={(e) => setNewDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
            <TextField fullWidth label="Motivo del traslado (opcional)" value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Decreto presidencial N° 1234/2026" />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" color="warning" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : <MoveIcon />}>
          {saving ? 'Guardando...' : 'Mover Feriado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: CourseCalendar
// ─────────────────────────────────────────────────────────────────────────────
const CourseCalendar = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const { userProfile } = useAuth();
  const isTeacher = userProfile?.role === 'teacher';

  const [loading,          setLoading]          = useState(true);
  const [calData,          setCalData]          = useState(null);
  const [units,            setUnits]            = useState([]);
  const [currentMonth,     setCurrentMonth]     = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [configOpen,       setConfigOpen]       = useState(false);
  const [moveHolidayOpen,  setMoveHolidayOpen]  = useState(false);
  const [createHolidayOpen, setCreateHolidayOpen] = useState(false);
  const [selectedHoliday,  setSelectedHoliday]  = useState(null);
  const [scheduleOpen,     setScheduleOpen]     = useState(false);
  const [selectedDateStr,  setSelectedDateStr]  = useState(null);

  const [classTemplates, setClassTemplates] = useState(() => getRomanClassesList(10));
  const [addEditClassOpen, setAddEditClassOpen] = useState(false);
  const [editingClassName, setEditingClassName] = useState(null);

  const nextClassSuggestion = useMemo(() => getNextClassTemplateName(classTemplates), [classTemplates]);

  useEffect(() => {
    if (calData?.scheduled_classes) {
      setClassTemplates((prev) => {
        const set = new Set(prev);
        calData.scheduled_classes.forEach((sc) => {
          const baseName = sc.title?.split(':')[0]?.trim() || sc.title?.trim();
          if (baseName) set.add(baseName);
        });
        return Array.from(set);
      });
    }
  }, [calData]);

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const [res, unitsRes] = await Promise.all([
        api.getCourseCalendar(courseId),
        api.getUnits(courseId).catch(() => ({ data: [] }))
      ]);
      setCalData(res.data);
      setUnits(unitsRes.data || []);
      // El calendario inicia mostrando el mes actual (Hoy)
    } catch (err) {
      toast.error('No se pudo cargar el calendario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const classDateSet = useMemo(() => {
    if (!calData?.class_dates) return new Set();
    return new Set(calData.class_dates.map((d) => d.date));
  }, [calData]);

  const holidayMap = useMemo(() => {
    if (!calData?.holidays) return {};
    const m = {};
    calData.holidays.forEach((h) => {
      const key = h.effective_date?.split('T')[0];
      if (key) m[key] = h;
    });
    return m;
  }, [calData]);

  const scheduledClassesMap = useMemo(() => {
    if (!calData?.scheduled_classes) return {};
    const m = {};
    calData.scheduled_classes.forEach((sc) => {
      const key = sc.class_date?.split('T')[0];
      if (key) m[key] = sc;
    });
    return m;
  }, [calData]);

  const isInRange = useCallback((dateStr) => {
    if (!calData?.calendar) return false;
    const start = calData.calendar.start_date?.split('T')[0];
    const end   = calData.calendar.end_date?.split('T')[0];
    return dateStr >= start && dateStr <= end;
  }, [calData]);

  const calendarDays = useMemo(() => {
    if (!calData?.calendar) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];

    for (let i = 0; i < firstDay; i++) grid.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = toDateStr(date);
      const isClass = classDateSet.has(dateStr);
      const holiday = holidayMap[dateStr] || null;
      const inRange = isInRange(dateStr);
      const isToday = dateStr === toDateStr(new Date());
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const scheduledClass = scheduledClassesMap[dateStr] || null;

      grid.push({ d, dateStr, isClass, holiday, inRange, isToday, isWeekend, scheduledClass });
    }
    return grid;
  }, [currentMonth, calData, classDateSet, holidayMap, scheduledClassesMap, isInRange]);

  const handlePrevMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleGoToday = () => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const handleSaveCalendar = async (formData) => {
    try {
      await api.saveCourseCalendar(courseId, formData);
      toast.success('Período y días de clase guardados');
      await loadCalendar();
    } catch (err) {
      toast.error(err.message || 'Error al guardar la configuración');
      throw err;
    }
  };

  const handleSaveHoliday = async (holidayId, data) => {
    try {
      await api.updateHoliday(holidayId, data);
      toast.success('Feriado actualizado');
      await loadCalendar();
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el feriado');
      throw err;
    }
  };

  const handleCreateHoliday = async (holidayData) => {
    try {
      await api.createHoliday(holidayData);
      toast.success('Feriado creado exitosamente');
      await loadCalendar();
    } catch (err) {
      toast.error(err.message || 'Error al crear el feriado');
      throw err;
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm('¿Estás seguro de eliminar este feriado?')) return;
    try {
      await api.deleteHoliday(holidayId);
      toast.success('Feriado eliminado');
      await loadCalendar();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar el feriado');
    }
  };

  const handleSaveScheduleClass = async (payload) => {
    try {
      await api.scheduleClassTopic(courseId, payload);
      toast.success('Clase asignada exitosamente');
      await loadCalendar();
    } catch (err) {
      toast.error(err.message || 'Error al asignar la clase');
      throw err;
    }
  };

  const handleDeleteScheduleClass = async (scheduleId) => {
    try {
      await api.deleteScheduleClass(courseId, scheduleId);
      toast.success('Clase desasignada');
      await loadCalendar();
    } catch (err) {
      toast.error(err.message || 'Error al desasignar la clase');
      throw err;
    }
  };

  const handleAddNextClass = () => {
    const nextName = getNextClassTemplateName(classTemplates);
    if (classTemplates.includes(nextName)) {
      toast.error(`Ya existe "${nextName}" en la plantilla`);
      return;
    }
    setClassTemplates((prev) => [...prev, nextName]);
    toast.success(`"${nextName}" añadida a la plantilla`);
  };

  const handleOpenEditClass = (name) => {
    setEditingClassName(name);
    setAddEditClassOpen(true);
  };

  const handleSaveClassTemplate = async (newName) => {
    if (editingClassName) {
      if (editingClassName === newName) return;
      setClassTemplates((prev) => prev.map((c) => (c === editingClassName ? newName : c)));

      const assigned = Object.values(scheduledClassesMap || {}).find((sc) =>
        sc.title?.toLowerCase().startsWith(editingClassName.toLowerCase())
      );
      if (assigned) {
        const remainder = assigned.title.replace(new RegExp(`^${editingClassName}\\s*[:—-]\\s*`, 'i'), '').trim();
        const updatedTitle = remainder && remainder !== editingClassName ? `${newName}: ${remainder}` : newName;
        try {
          await api.scheduleClassTopic(courseId, {
            class_date: assigned.class_date?.split('T')[0],
            unit_id: assigned.unit_id || null,
            title: updatedTitle,
            description: assigned.description || '',
          });
          await loadCalendar();
        } catch {
        }
      }
      toast.success(`Clase renombrada a "${newName}"`);
    } else {
      if (classTemplates.includes(newName)) {
        toast.error('Ya existe una clase con ese nombre');
        return;
      }
      setClassTemplates((prev) => [...prev, newName]);
      toast.success(`"${newName}" añadida a la plantilla`);
    }
  };

  const handleDeleteClassTemplate = async (className) => {
    const assigned = Object.values(scheduledClassesMap || {}).find((sc) =>
      sc.title?.toLowerCase().startsWith(className.toLowerCase())
    );

    if (assigned) {
      if (!window.confirm(`"${className}" está asignada al ${assigned.class_date?.split('T')[0]}. ¿Deseas desasignarla y eliminarla de la plantilla?`)) {
        return;
      }
      try {
        await api.deleteScheduleClass(courseId, assigned.id);
        toast.success(`"${className}" desasignada y eliminada`);
        await loadCalendar();
      } catch (err) {
        toast.error(err.message || 'Error al eliminar');
      }
    } else {
      toast.success(`"${className}" eliminada de la plantilla`);
    }

    setClassTemplates((prev) => prev.filter((c) => c !== className));
  };

  const handleCellClick = (cell) => {
    if (!cell) return;
    if (cell.holiday) {
      if (isTeacher) {
        setSelectedHoliday(cell.holiday);
        setMoveHolidayOpen(true);
      }
      return;
    }
    if (cell.isClass && cell.inRange) {
      setSelectedDateStr(cell.dateStr);
      setScheduleOpen(true);
    }
  };

  const getCellStyle = (cell) => {
    if (!cell) return {};
    let style = {};

    if (cell.holiday) {
      style = {
        background: 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)',
        color: '#ffffff',
        fontWeight: 700,
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)',
      };
    } else if (cell.isClass && cell.inRange) {
      style = {
        background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
        color: '#ffffff',
        fontWeight: 700,
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(21, 101, 192, 0.4)',
      };
    } else if (cell.inRange) {
      style = {
        backgroundColor: 'rgba(33, 150, 243, 0.08)',
        borderRadius: '6px',
        border: '1px solid rgba(33, 150, 243, 0.25)',
      };
    } else {
      style = {
        color: cell.isWeekend ? 'text.disabled' : 'text.secondary',
      };
    }

    if (cell.isToday) {
      style.border = '2.5px solid #ff9800';
      style.borderRadius = '8px';
      style.boxShadow = style.boxShadow
        ? `${style.boxShadow}, 0 0 10px 2px rgba(255, 152, 0, 0.75)`
        : '0 0 10px 2px rgba(255, 152, 0, 0.6)';
      if (!cell.holiday && (!cell.isClass || !cell.inRange)) {
        style.background = 'linear-gradient(135deg, rgba(255, 179, 0, 0.25) 0%, rgba(255, 152, 0, 0.4) 100%)';
        style.color = '#b26a00';
      }
      style.zIndex = 2;
    }

    return style;
  };

  if (loading) {
    return (
      <Box p={3}>
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const { calendar, stats, holidays = [], course } = calData || {};

  const handleBack = () => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'director' || userProfile?.role === 'coordinator') {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/admin/roles');
      }
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3 }} maxWidth="xl" mx="auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Tooltip title={userProfile?.role === 'admin' || userProfile?.role === 'director' || userProfile?.role === 'coordinator' ? 'Volver a Supervisión / Roles' : 'Volver al curso'}>
              <IconButton onClick={handleBack} color="primary" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <BackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="primary" />
                Calendario Escolar
              </Typography>
              {course && (
                <Typography variant="caption" color="text.secondary">
                  {course.title || course.name} — {course.semester_name || course.semester || 'Semestre'}
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {isTeacher && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={() => setConfigOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {calendar ? 'Cambiar Período y Días' : 'Configurar Calendario'}
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={3}
                py={2}
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="h6" fontWeight={700}>
                    {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<TodayIcon />}
                    onClick={handleGoToday}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.25,
                    }}
                  >
                    Ir a Hoy
                  </Button>
                </Box>
                <Box display="flex" gap={0.5}>
                  <IconButton size="small" onClick={handlePrevMonth}>
                    <PrevIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleNextMonth}>
                    <NextIcon />
                  </IconButton>
                </Box>
              </Box>

              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Grid container columns={7} spacing={0.5} sx={{ mb: 1 }}>
                  {DAY_NAMES.map((name) => (
                    <Grid item xs={1} key={name}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" textAlign="center">
                        {name}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mb: 1 }} />
                <Grid container columns={7} spacing={0.5}>
                  {calendarDays.map((cell, idx) => {
                    if (!cell) return <Grid item xs={1} key={`empty-${idx}`} sx={{ height: 52 }} />;
                    const style = getCellStyle(cell);
                    return (
                      <Grid item xs={1} key={cell.dateStr}>
                        <Box
                          onClick={() => handleCellClick(cell)}
                          sx={{
                            height: 52,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            cursor: cell.holiday || (cell.isClass && cell.inRange) ? 'pointer' : 'default',
                            ...style,
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                        >
                          {cell.isToday && (
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                top: 1,
                                fontSize: '0.55rem',
                                fontWeight: 900,
                                color: cell.holiday || (cell.isClass && cell.inRange) ? '#ffe082' : '#b26a00',
                                letterSpacing: '0.5px',
                              }}
                            >
                              HOY
                            </Typography>
                          )}
                          <Typography variant="body2" fontWeight={cell.isToday ? 900 : cell.isClass || cell.holiday ? 700 : 400} sx={{ fontSize: '0.8rem', color: style.color || 'text.primary' }}>
                            {cell.d}
                          </Typography>
                          {cell.scheduledClass && !cell.holiday && <TopicIcon sx={{ fontSize: 13, color: '#ffe082', mt: -0.25 }} />}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
                <Divider sx={{ mt: 2.5, mb: 1.5 }} />
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                  {[
                    { label: 'Día de clase', renderBox: (<Box sx={{ width: 24, height: 18, borderRadius: '5px', background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)', boxShadow: '0 1px 3px rgba(21,101,192,0.3)' }} />) },
                    { label: 'Tema asignado', renderBox: (<Box sx={{ width: 24, height: 18, borderRadius: '5px', background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(21,101,192,0.3)' }}><TopicIcon sx={{ fontSize: 11, color: '#ffe082' }} /></Box>) },
                    { label: 'Feriado', renderBox: (<Box sx={{ width: 24, height: 18, borderRadius: '5px', background: 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)', boxShadow: '0 1px 3px rgba(211,47,47,0.3)' }} />) },
                    { label: 'Dentro del semestre', renderBox: (<Box sx={{ width: 24, height: 18, borderRadius: '5px', backgroundColor: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.25)' }} />) },
                    { label: 'Hoy (Día actual)', renderBox: (<Box sx={{ width: 26, height: 18, borderRadius: '5px', background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.25) 0%, rgba(255, 152, 0, 0.4) 100%)', border: '2px solid #ff9800', boxShadow: '0 0 6px rgba(255, 152, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontSize: '0.45rem', fontWeight: 900, color: '#b26a00' }}>HOY</Typography></Box>) },
                  ].map((item) => (
                    <Box key={item.label} display="flex" alignItems="center" gap={0.75}>
                      {item.renderBox}
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Panel: Class Templates, Stats, Holidays */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2}>
            {isTeacher && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
                    <TopicIcon color="secondary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Plantilla de Clases
                    </Typography>
                    <Chip
                      label={`${classTemplates.filter(t => Object.values(scheduledClassesMap || {}).some(sc => sc.title?.toLowerCase().startsWith(t.toLowerCase()))).length}/${classTemplates.length}`}
                      size="small"
                      color="secondary"
                      sx={{ fontWeight: 700 }}
                    />
                    {isTeacher && (
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={handleAddNextClass}
                        sx={{ ml: 'auto', textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: '0.75rem', py: 0.3, px: 1.2 }}
                      >
                        Añadir {nextClassSuggestion}
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Gestiona, edita o elimina las clases planeadas para este semestre
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
                    {classTemplates.map((t) => {
                      const assigned = Object.values(scheduledClassesMap || {}).find((sc) =>
                        sc.title?.toLowerCase().startsWith(t.toLowerCase())
                      );
                      return (
                        <Box
                          key={t}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          p={1}
                          mb={0.75}
                          borderRadius={1.5}
                          sx={{
                            backgroundColor: assigned ? 'rgba(46, 125, 50, 0.08)' : 'action.hover',
                            border: assigned ? '1px solid rgba(46, 125, 50, 0.25)' : '1px solid transparent',
                          }}
                        >
                          <Box flex={1} minWidth={0} mr={1}>
                            <Typography variant="body2" fontWeight={700} color={assigned ? 'success.main' : 'text.primary'} noWrap>
                              {t}
                            </Typography>
                            {assigned?.title && assigned.title !== t && (
                              <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 150 }}>
                                {assigned.title.replace(new RegExp(`^${t}\\s*[:—-]\\s*`, 'i'), '')}
                              </Typography>
                            )}
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.5}>
                            {assigned ? (
                              <Chip
                                label={`Cargada (${assigned.class_date?.split('T')[0]?.slice(5)})`}
                                size="small"
                                color="success"
                                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                              />
                            ) : (
                              <Chip
                                label="Pendiente"
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.68rem', color: 'text.disabled' }}
                              />
                            )}

                            {isTeacher && (
                              <>
                                <Tooltip title="Editar nombre de clase">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditClass(t)}
                                    sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar clase de la plantilla">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteClassTemplate(t)}
                                    sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                    {classTemplates.length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        No hay clases en la plantilla.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* 2. Stats card */}
            {calendar && stats && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <StatsIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>Estadísticas del Semestre</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {[
                      { label: 'Días de clase programados', value: stats.total_class_days, color: '#1565c0' },
                      { label: 'Temas/Unidades asignadas', value: stats.scheduled_topics_count || 0, color: '#7b1fa2' },
                      { label: 'Días efectivos (sin feriados)', value: stats.effective_class_days, color: '#2e7d32' },
                      { label: 'Feriados en días de clase', value: stats.holiday_days, color: '#c62828' },
                    ].map((item) => (
                      <Box key={item.label} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                        <Chip
                          label={item.value}
                          size="small"
                          sx={{ fontWeight: 700, backgroundColor: item.color, color: '#fff', minWidth: 40 }}
                        />
                      </Box>
                    ))}
                    <Divider sx={{ mt: 1, mb: 1.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Período: {calendar.start_date?.split('T')[0]} → {calendar.end_date?.split('T')[0]}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 3. Holidays card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                    <HolidayIcon color="error" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Feriados y Asuetos
                    </Typography>
                    <Chip label={`${holidays.length}`} size="small" color="error" sx={{ fontWeight: 700 }} />
                    {isTeacher && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateHolidayOpen(true)}
                        sx={{ ml: 'auto', textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: '0.75rem', py: 0.25 }}
                      >
                        Nuevo Feriado
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Año {currentMonth.getFullYear()}
                    {isTeacher && <> — Clic en <EditIcon sx={{ fontSize: 12, verticalAlign: 'middle', mx: 0.25 }} /> para mover o <DeleteIcon sx={{ fontSize: 12, verticalAlign: 'middle', mx: 0.25 }} /> para eliminar</>}
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
                    {holidays
                      .filter((h) => {
                        const hYear = parseLocalDate(h.effective_date.split('T')[0]).getFullYear();
                        return hYear === currentMonth.getFullYear();
                      })
                      .map((h) => {
                        const effectiveDateStr = h.effective_date?.split('T')[0];
                        const effectiveLocalDate = parseLocalDate(effectiveDateStr);
                        const isInClassDay = classDateSet.has(effectiveDateStr);
                        return (
                          <Box key={h.id} display="flex" alignItems="flex-start" gap={1} mb={1.25} sx={{ p: 1, borderRadius: 1.5, backgroundColor: isInClassDay ? 'rgba(211,47,47,0.08)' : 'action.hover', border: isInClassDay ? '1px solid rgba(211,47,47,0.3)' : '1px solid transparent' }}>
                            <Box sx={{ minWidth: 44, height: 44, borderRadius: 1.5, backgroundColor: '#d32f2f', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.2 }}>
                              <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>{MONTH_NAMES[effectiveLocalDate.getMonth()]?.slice(0, 3).toUpperCase()}</Typography>
                              <Typography variant="body2" fontWeight={900} sx={{ fontSize: '0.95rem' }}>{effectiveLocalDate.getDate()}</Typography>
                            </Box>
                            <Box flex={1} minWidth={0}>
                              <Typography variant="body2" fontWeight={600} noWrap>{h.name}</Typography>
                              {h.is_moved && (<Typography variant="caption" color="warning.main" display="block">↳ Trasladado desde {h.original_date?.split('T')[0]}</Typography>)}
                              {isInClassDay && (<Chip label="Afecta clase" size="small" color="error" variant="outlined" sx={{ mt: 0.25, height: 18, fontSize: '0.6rem' }} />)}
                            </Box>
                            {isTeacher && (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Tooltip title="Mover fecha del feriado">
                                  <IconButton
                                    size="small"
                                    onClick={() => { setSelectedHoliday(h); setMoveHolidayOpen(true); }}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar feriado">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteHoliday(h.id)}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    {holidays.filter((h) => parseLocalDate(h.effective_date.split('T')[0]).getFullYear() === currentMonth.getFullYear()).length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        No hay feriados para {currentMonth.getFullYear()}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Grid>
      </Grid>

      <CalendarConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        calendar={calendar}
        course={course}
        onSave={handleSaveCalendar}
      />
      <MoveHolidayDialog
        open={moveHolidayOpen}
        holiday={selectedHoliday}
        onClose={() => { setMoveHolidayOpen(false); setSelectedHoliday(null); }}
        onSave={handleSaveHoliday}
      />
      <CreateHolidayDialog
        open={createHolidayOpen}
        onClose={() => setCreateHolidayOpen(false)}
        onSave={handleCreateHoliday}
      />
      <AddEditClassTemplateDialog
        open={addEditClassOpen}
        onClose={() => setAddEditClassOpen(false)}
        editingClassName={editingClassName}
        onSave={handleSaveClassTemplate}
      />
      <ScheduleClassDialog
        open={scheduleOpen}
        onClose={() => { setScheduleOpen(false); setSelectedDateStr(null); }}
        dateStr={selectedDateStr}
        scheduledClass={selectedDateStr ? scheduledClassesMap[selectedDateStr] : null}
        units={units}
        classTemplates={classTemplates}
        scheduledClassesMap={scheduledClassesMap}
        isTeacher={isTeacher}
        onSave={handleSaveScheduleClass}
        onDelete={handleDeleteScheduleClass}
      />
    </Box>
  );
};

export default CourseCalendar;

