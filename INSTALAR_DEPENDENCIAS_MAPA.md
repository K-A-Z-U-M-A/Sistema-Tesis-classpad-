# 🗺️ Instalar Dependencias del Mapa Interactivo

## ⚠️ Error que estás viendo:

```
GET http://localhost:5173/src/components/LocationMap.jsx net::ERR_ABORTED 500 (Internal Server Error)
```

Este error indica que las dependencias de **Leaflet** no están instaladas.

## ✅ Solución Rápida:

Abre una **PowerShell** o **CMD** en la carpeta `web` y ejecuta:

```bash
npm install
```

O si quieres instalar solo las dependencias del mapa:

```bash
npm install html5-qrcode leaflet react-leaflet
```

## 📋 Pasos Completos:

1. **Abre PowerShell o CMD**
2. **Ve a la carpeta del proyecto:**
   ```bash
   cd "C:\Users\Abi\Documents\06-Sexto Año\Tesis-Classpad\Sistema-Tesis-classpad-\web"
   ```
3. **Ejecuta npm install:**
   ```bash
   npm install
   ```
4. **Espera a que termine la instalación**
5. **Reinicia el servidor de desarrollo** (Ctrl+C y vuelve a ejecutar `npm run dev`)

## 🔍 Verificar la Instalación:

Después de instalar, verifica que estas carpetas existen en `web/node_modules`:

- ✅ `node_modules/html5-qrcode`
- ✅ `node_modules/leaflet`
- ✅ `node_modules/react-leaflet`

## 🎯 Después de Instalar:

1. **Reinicia el servidor de desarrollo:**
   - Presiona `Ctrl+C` en la terminal donde corre `npm run dev`
   - Ejecuta de nuevo: `npm run dev`

2. **Recarga el navegador:**
   - Presiona `F5` o `Ctrl+R` para recargar la página
   - El error debería desaparecer

3. **Prueba el mapa:**
   - Ve a la página de **Asistencia**
   - Haz click en **"Nueva Sesión"**
   - Activa **"Requerir Geolocalización"**
   - Deberías ver el mapa interactivo 🗺️

## ❓ ¿Por qué ocurre esto?

Las dependencias `leaflet` y `react-leaflet` están en el archivo `package.json`, pero no se han instalado físicamente en tu carpeta `node_modules`. 

Esto suele ocurrir cuando:
- Acabas de clonar el proyecto
- Alguien más agregó nuevas dependencias
- Borraste accidentalmente `node_modules`

## 🚀 ¿Listo?

Después de instalar, el mapa interactivo debería funcionar perfectamente:
- ✅ Seleccionar ubicación haciendo click en el mapa
- ✅ Arrastrar el marcador
- ✅ Usar "Mi Ubicación" para ubicar automáticamente
- ✅ Campos de latitud/longitud se actualizan automáticamente

---

💡 **Tip:** Si el problema persiste, asegúrate de que `npm` esté actualizado:
```bash
npm --version
```
Debería ser versión 7 o superior.

