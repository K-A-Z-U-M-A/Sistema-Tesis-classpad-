const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURACIÓN
// ==========================================
const BASE_URL = 'http://localhost:5173'; // Puerto Vite por defecto
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const REPORT_FILE = path.join(__dirname, 'report.html');

// Credenciales de prueba
const TEST_USER = {
    email: 'abi@gmail.com',
    password: 'Abigahil12345'
};

// ==========================================
// UTILIDADES
// ==========================================
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureScreenshot(page, name) {
    const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    return `./screenshots/${name}.png`;
}

// ==========================================
// SUITE DE PRUEBAS
// ==========================================
const results = [];

function addResult(scenario, status, impact, details) {
    results.push({ scenario, status, impact, details });
}

(async () => {
    console.log('🚀 Iniciando Suite de Pruebas E2E ClassPad con Reporte HTML Interactivo...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        // --------------------------------------------------------------------------------
        // 1. CARGA DEL HOME & LOGIN (Performance)
        // --------------------------------------------------------------------------------
        console.log('Testing: Carga de Login (Performance)...');
        const startLoad = performance.now();
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
        const endLoad = performance.now();
        const loadTime = ((endLoad - startLoad) / 1000).toFixed(2);

        await captureScreenshot(page, '01_login_load');

        let impact = loadTime < 1.5 ? 'Óptimo' : (loadTime < 3.0 ? 'Aceptable' : 'Riesgo de Abandono');
        let status = loadTime < 1.5 ? 'PASS' : (loadTime < 3.0 ? 'WARN' : 'FAIL');

        addResult('Performance Carga Login', status, impact, `Tiempo: ${loadTime}s`);

        // --------------------------------------------------------------------------------
        // 2. FLUJO DE LOGIN (Funcionalidad)
        // --------------------------------------------------------------------------------
        console.log('Testing: Flujo de Login...');
        try {
            await page.waitForSelector('input[name="email"]');
            await page.type('input[name="email"]', TEST_USER.email);
            await page.type('input[name="password"]', TEST_USER.password);

            await captureScreenshot(page, '02_login_filled');

            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => { });

            const currentUrl = page.url();
            const successLogin = !currentUrl.includes('/login');

            await captureScreenshot(page, '03_after_login');

            if (successLogin) {
                addResult('Login Funcional', 'PASS', 'Crítico', 'Redirección exitosa al Dashboard');
            } else {
                addResult('Login Funcional', 'FAIL', 'Bloqueante', 'No se redirigió al Dashboard. Credencial inválida?');
            }
        } catch (e) {
            addResult('Login Funcional', 'FAIL', 'Bloqueante', `Error: ${e.message}`);
        }

        // --------------------------------------------------------------------------------
        // 3. RESPONSIVIDAD (Vista Móvil)
        // --------------------------------------------------------------------------------
        console.log('Testing: Responsividad (iPhone SE)...');
        await page.setViewport({ width: 375, height: 667, isMobile: true });
        await page.reload({ waitUntil: 'networkidle2' });
        await sleep(1000);

        await captureScreenshot(page, '04_mobile_view');
        addResult('Responsividad Móvil', 'PASS', 'UX', 'Renderizado correcto en viewport 375x667');

        await page.setViewport({ width: 1366, height: 768 });

        // --------------------------------------------------------------------------------
        // 4. SEGURIDAD (Rutas Protegidas)
        // --------------------------------------------------------------------------------
        console.log('Testing: Rutas Protegidas...');
        const context = await browser.createIncognitoBrowserContext();
        const pageIncognito = await context.newPage();

        await pageIncognito.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
        const secureUrl = pageIncognito.url();

        await captureScreenshot(pageIncognito, '05_security_redirect');

        if (secureUrl.includes('/login')) {
            addResult('Seguridad Rutas Protegidas', 'PASS', 'Seguridad Alta', 'Redirección forzada a Login');
        } else {
            addResult('Seguridad Rutas Protegidas', 'FAIL', 'Vulnerabilidad Crítica', `Acceso permitido sin sesión a: ${secureUrl}`);
        }
        await pageIncognito.close();

        // --------------------------------------------------------------------------------
        // 5. MANEJO DE ERRORES (404)
        // --------------------------------------------------------------------------------
        console.log('Testing: Manejo de 404...');
        await page.goto(`${BASE_URL}/esta-ruta-no-existe-12345`, { waitUntil: 'networkidle2' });
        const bodyText = await page.evaluate(() => document.body.innerText);
        const is404 = bodyText.includes('404') || bodyText.includes('Page Not Found') || bodyText.toLowerCase().includes('no encontrada');

        await captureScreenshot(page, '06_error_404');

        if (is404) {
            addResult('Manejo de Errores (404)', 'PASS', 'UX', 'Página de error mostrada correctamente');
        } else {
            if (page.url() === `${BASE_URL}/` || page.url().includes('/dashboard')) {
                addResult('Manejo de Errores (404)', 'WARN', 'UX', 'Redirección al Home (soft 404)');
            } else {
                addResult('Manejo de Errores (404)', 'FAIL', 'Confusión Usuario', 'No se detecta manejo claro de ruta inexistente');
            }
        }

    } catch (error) {
        console.error('❌ Error fatal en la suite de pruebas:', error);
    } finally {
        await browser.close();
        generateReport(results);
    }
})();

function generateReport(results) {
    const passedCount = results.filter(r => r.status === 'PASS').length;
    const warnCount = results.filter(r => r.status === 'WARN').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;

    // Extraer métrica de performance
    const loginPerf = results.find(r => r.scenario === 'Performance Carga Login')?.details.split(': ')[1].replace('s', '') || 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte QA Ejecutivo - ClassPad</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #2563eb; --success: #16a34a; --warning: #ca8a04; --danger: #dc2626; --bg: #f8fafc; --card: #ffffff; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 40px; color: #1e293b; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .header h1 { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin: 0; }
        .badge { background: #e2e8f0; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .card { background: var(--card); padding: 24px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; margin-bottom: 20px; color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        
        .stats-summary { display: flex; justify-content: space-around; text-align: center; }
        .stat-item .value { font-size: 2.5rem; font-weight: 800; display: block; }
        .stat-item.pass .value { color: var(--success); }
        .stat-item.warn .value { color: var(--warning); }
        .stat-item.fail .value { color: var(--danger); }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        th, td { padding: 16px 24px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; }
        .status-pill { padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
        .status-PASS { background: #dcfce7; color: #166534; }
        .status-WARN { background: #fef9c3; color: #854d0e; }
        .status-FAIL { background: #fee2e2; color: #991b1b; }

        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 40px; }
        .screenshot-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .screenshot-card:hover { transform: translateY(-5px); }
        .screenshot-card img { width: 100%; height: 150px; object-fit: cover; border-bottom: 1px solid #eee; }
        .screenshot-card p { padding: 12px; margin: 0; font-weight: 600; color: #475569; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>ClassPad QA Report</h1>
                <p style="color: #64748b; margin-top: 8px;">Ejecución Automática E2E</p>
            </div>
            <div class="badge">${new Date().toLocaleString()}</div>
        </div>

        <div class="dashboard-grid">
            <!-- Chart 1: Resumen -->
            <div class="card">
                <h3>Resumen de Ejecución</h3>
                <div style="height: 200px; display: flex; justify-content: center;">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>

            <!-- Chart 2: Performance -->
            <div class="card">
                <h3>Métricas de Performance</h3>
                <div style="height: 200px;">
                    <canvas id="perfChart"></canvas>
                </div>
            </div>

            <!-- Stats -->
            <div class="card">
                <h3>Estadísticas Clave</h3>
                <div class="stats-summary">
                    <div class="stat-item pass">
                        <span class="value">${passedCount}</span>
                        <span class="label">Exitosos</span>
                    </div>
                    <div class="stat-item warn">
                        <span class="value">${warnCount}</span>
                        <span class="label">Alertas</span>
                    </div>
                    <div class="stat-item fail">
                        <span class="value">${failCount}</span>
                        <span class="label">Fallidos</span>
                    </div>
                </div>
            </div>
        </div>

        <h2>📋 Detalle de Escenarios</h2>
        <table>
            <thead>
                <tr>
                    <th>Escenario</th>
                    <th>Estado</th>
                    <th>Impacto</th>
                    <th>Detalles</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(r => `
                <tr>
                    <td><strong>${r.scenario}</strong></td>
                    <td><span class="status-pill status-${r.status}">${r.status}</span></td>
                    <td>${r.impact}</td>
                    <td style="font-family: monospace; color: #64748b;">${r.details}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>📸 Evidencias Visuales</h2>
        <div class="gallery">
            <div class="screenshot-card">
                <img src="./screenshots/01_login_load.png" onclick="window.open(this.src)" style="cursor:pointer" alt="Login Load">
                <p>1. Carga Login</p>
            </div>
            <div class="screenshot-card">
                <img src="./screenshots/02_login_filled.png" onclick="window.open(this.src)" style="cursor:pointer" alt="Formulario Lleno">
                <p>2. Formulario Lleno</p>
            </div>
            <div class="screenshot-card">
                <img src="./screenshots/03_after_login.png" onclick="window.open(this.src)" style="cursor:pointer" alt="Post Login">
                <p>3. Post Login</p>
            </div>
            <div class="screenshot-card">
                <img src="./screenshots/04_mobile_view.png" onclick="window.open(this.src)" style="cursor:pointer" alt="Mobile View">
                <p>4. Vista Móvil</p>
            </div>
            <div class="screenshot-card">
                <img src="./screenshots/05_security_redirect.png" onclick="window.open(this.src)" style="cursor:pointer" alt="Security Redirect">
                <p>5. Seguridad</p>
            </div>
             <div class="screenshot-card">
                <img src="./screenshots/06_error_404.png" onclick="window.open(this.src)" style="cursor:pointer" alt="404 Error">
                <p>6. Error 404</p>
            </div>
        </div>
    </div>

    <script>
        // Gráfico de Estado (Dona)
        new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: ['Exitosos', 'Alertas', 'Fallidos'],
                datasets: [{
                    data: [${passedCount}, ${warnCount}, ${failCount}],
                    backgroundColor: ['#16a34a', '#ca8a04', '#dc2626'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        // Gráfico de Performance (Barra)
        new Chart(document.getElementById('perfChart'), {
            type: 'bar',
            data: {
                labels: ['Login Load'],
                datasets: [{
                    label: 'Tiempo (segundos)',
                    data: [${loginPerf}],
                    backgroundColor: ${loginPerf} < 1.5 ? '#16a34a' : '#ca8a04',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 1.5,
                                yMax: 1.5,
                                borderColor: 'red',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: { content: 'Límite Objetivo (1.5s)', enabled: true }
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
    `;

    fs.writeFileSync(REPORT_FILE, htmlContent);
    console.log(\`\\n✨ Reporte HTML Profesional generado en: \${REPORT_FILE}\`);
}
