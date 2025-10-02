import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  // FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  // InputLabel,
  Button,
  Alert,
} from '@mui/material';
import {
  // Notifications,
  // Security,
  // Palette,
  // Language,
  Email,
  Smartphone,
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false,
    darkMode: false,
    language: 'es',
  });

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handle2FAToggle = async () => {
    try {
      // Simular configuración de 2FA
      await new Promise(resolve => setTimeout(resolve, 1000));
      handleSettingChange('twoFactorAuth', !settings.twoFactorAuth);
    } catch (error) {
      console.error('Error al configurar 2FA:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ⚙️ Configuración
      </Typography>

      <Box display="flex" flexDirection="column" gap={3}>
        {/* Notificaciones */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔔 Notificaciones
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Notificaciones por Email"
                  secondary="Recibe notificaciones importantes por correo electrónico"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Notificaciones Push"
                  secondary="Recibe notificaciones en tiempo real en tu dispositivo"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔐 Seguridad
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Autenticación de Dos Factores"
                  secondary="Añade una capa extra de seguridad a tu cuenta"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={handle2FAToggle}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Cambiar Contraseña"
                  secondary="Actualiza tu contraseña regularmente"
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Cambiar
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎨 Apariencia
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Modo Oscuro"
                  secondary="Cambia entre tema claro y oscuro"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Idioma"
                  secondary="Selecciona el idioma de la interfaz"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="pt">Português</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Información de la cuenta */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Información de la Cuenta
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              ID de Usuario: <strong>user_123456789</strong>
            </Alert>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary="juan.perez@estudiante.edu"
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Verificar
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Fecha de Creación"
                  secondary="15 de Enero, 2024"
                />
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Último Acceso"
                  secondary="Hace 2 horas"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Acciones de cuenta */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚠️ Acciones de Cuenta
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Email />}
              >
                Exportar Datos
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<Smartphone />}
              >
                Eliminar Cuenta
              </Button>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Estas acciones son permanentes y no se pueden deshacer.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Settings; 