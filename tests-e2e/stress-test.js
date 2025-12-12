const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.join(__dirname, 'LOAD_REPORT.txt');

console.log('🚀 Iniciando Prueba de Carga (Stress Test) en Backend ClassPad...');
console.log('🎯 Target: http://localhost:3001 (Backend API)');
console.log('👥 Simulación: 100 usuarios concurrentes durante 10 segundos');

const instance = autocannon({
    url: 'http://localhost:3001', // Apuntar a la raíz del backend (o /api/config si existe)
    connections: 100, // 100 usuarios simultáneos
    duration: 10,     // 10 segundos
    pipelining: 1,    // 1 petición por conexión a la vez
}, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        // Generar reporte en consola y archivo
        const report = generateReport(result);
        console.log(report);
        fs.writeFileSync(REPORT_FILE, report);
        console.log(`\n✅ Reporte de Carga guardado en: ${REPORT_FILE}`);
    }
});

autocannon.track(instance, { renderProgressBar: true });

function generateReport(result) {
    return `
===========================================================
🔥 REPORTE DE PRUEBAS DE CARGA - CLASSPAD BACKEND 🔥
===========================================================
Fecha: ${new Date().toLocaleString()}
Duración: ${result.duration} segundos
Conexiones concurrentes: ${result.connections}

📊 RENDIMIENTO GENERAL
-----------------------
Total Peticiones:      ${result.requests.total}
Total Bytes Tx:        ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB
Peticiones/Segundo:    ${result.requests.average} req/s (Promedio)
Latencia Promedio:     ${result.latency.average} ms

⚡ LATENCIAS (Tiempos de respuesta)
-----------------------------------
Rápido (Top 1%):       ${result.latency.p99} ms
Medio:                 ${result.latency.average} ms
Lento (Max):           ${result.latency.max} ms

🏆 CLASIFICACIÓN
----------------
${rankPerf(result.requests.average, result.latency.average)}

===========================================================
`;
}

function rankPerf(reqs, lat) {
    if (reqs > 1000 && lat < 50) return "🚀 EXCELENTE: El servidor vuela. Soporta tráfico alto.";
    if (reqs > 500 && lat < 200) return "✅ BUENO: Rendimiento sólido para producción normal.";
    if (reqs > 100) return "⚠️ REGULAR: Aceptable para tráfico bajo/medio.";
    return "❌ CRÍTICO: El servidor sufre con carga. Requiere optimización.";
}
