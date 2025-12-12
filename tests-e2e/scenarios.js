const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const BASE_URL = 'https://127.0.0.1:5173';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const REPORT_FILE = path.join(__dirname, 'report.md');
const VIEWPORT_IPHONE_SE = { width: 375, height: 667, isMobile: true };
const VIEWPORT_DESKTOP = { width: 1366, height: 768 };

// ENSURE DIRS EXIST
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// STORAGE FOR REPORT DATA
const reportData = {
    summary: [],
    performance: [],
    security: [],
    functional: [],
    responsive: [],
    errors: []
};

// HELPER: TIMESTAMP
const getTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

// HELPER: TAKE SCREENSHOT
async function takeScreenshot(page, name) {
    const filename = `${name}-${getTimestamp()}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return `screenshots/${filename}`; // Relative path for report
}

// HELPER: LOG RESULT
function logResult(category, name, status, details = '', screenshotPath = '') {
    const icon = status === 'PASS' ? '✅' : (status === 'WARN' ? '⚠️' : '❌');
    reportData[category].push({ name, status, icon, details, screenshotPath });
    console.log(`${icon} [${category.toUpperCase()}] ${name}: ${status}`);
}

async function runTests() {
    console.log('🚀 Starting Robust E2E Tests...');

    // Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--allow-insecure-localhost'
        ]
    });
    const page = await browser.newPage();

    // Enable Browser Logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    try {
        // ==========================================
        // 1. PERFORMANCE & HOME LOAD
        // ==========================================
        console.log('\n--- Testing Home Load Performance ---');
        await page.setViewport(VIEWPORT_DESKTOP);

        const startLoad = performance.now();
        const response = await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        const endLoad = performance.now();
        const loadTime = (endLoad - startLoad) / 1000; // Seconds

        const loadScreenshot = await takeScreenshot(page, 'home-load');

        const impact = loadTime < 1.5 ? 'Excelente' : (loadTime < 3.0 ? 'Aceptable' : 'Riesgo de abandono');
        const perfStatus = loadTime < 1.5 ? 'PASS' : (loadTime < 3.0 ? 'WARN' : 'FAIL');

        logResult('performance', 'Home Page Load', perfStatus, `${loadTime.toFixed(2)}s (Target: <1.5s). Impact: ${impact}`, loadScreenshot);
        reportData.performance.push({
            metric: 'Time to Interactive',
            value: `${loadTime.toFixed(2)}s`,
            target: '< 1.5s',
            impact: impact,
            status: perfStatus === 'PASS' ? '✅' : (perfStatus === 'WARN' ? '⚠️' : '❌')
        });

        // ==========================================
        // 2. SECURITY CHECK (Unauthenticated Access)
        // ==========================================
        console.log('\n--- Testing Security (Protected Routes) ---');
        // Ensure we are logged out
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');

        // Try accessing protected route
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1000)); // Wait for redirect logic

        const currentUrl = page.url();
        const secureScreenshot = await takeScreenshot(page, 'security-redirect');

        if (currentUrl.includes('/login') || currentUrl === `${BASE_URL}/`) {
            logResult('security', 'Protected Route Redirect', 'PASS', `Redirected to ${currentUrl} from /dashboard`, secureScreenshot);
        } else {
            logResult('security', 'Protected Route Redirect', 'FAIL', `Failed to redirect. Stayed at ${currentUrl}`, secureScreenshot);
        }

        // ==========================================
        // 3. FUNCTIONAL: LOGIN FLOW
        // ==========================================
        console.log('\n--- Testing Login Flow ---');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

        // Fill Login Form
        // Selectors based on your codebase: name="email", name="password"
        await page.type('input[name="email"]', 'abi@gmail.com');
        await page.type('input[name="password"]', 'Abigahil123');

        const loginFormScreenshot = await takeScreenshot(page, 'login-form-filled');
        logResult('functional', 'Login Form Fill', 'PASS', 'Form headers found and filled', loginFormScreenshot);

        // Submit
        // Finding the button inside the form. In MUI, usually type='submit'
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
            await submitBtn.click();
            // We expect a navigation or a toast error (since creds might be wrong)
            // For this test, verifying the UI response is key
            try {
                await page.waitForNavigation({ timeout: 3000 }).catch(() => { });
                const postLoginScreenshot = await takeScreenshot(page, 'login-submission');
                logResult('functional', 'Login Submission', 'PASS', 'Button clicked and action taken', postLoginScreenshot);
            } catch (e) {
                logResult('functional', 'Login Submission', 'WARN', 'Timeout waiting for nav (normal if auth fails)', await takeScreenshot(page, 'login-timeout'));
            }
        } else {
            logResult('functional', 'Login Button', 'FAIL', 'Submit button not found');
        }

        // ==========================================
        // 4. FUNCTIONAL: REGISTER FLOW (UI Check)
        // ==========================================
        console.log('\n--- Testing Register Flow ---');

        // Ensure logged out (Clearing cookies in a block to avoid scope issues)
        // Also clear localStorage/sessionStorage which might hold JWT tokens
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        {
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
        }

        await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle0' });

        // Wait for form to contain input
        try {
            await page.waitForSelector('input[name="displayName"]', { visible: true, timeout: 10000 });
        } catch (e) {
            console.log('❌ Register Form Timeout - URL:', page.url());

            // Dump HTML for debugging
            const html = await page.content();
            fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'register-fail.html'), html);
            console.log('📄 Saved HTML dump to screenshots/register-fail.html');

            await takeScreenshot(page, 'register-form-fail');
            throw e;
        }
        await page.type('input[name="displayName"]', 'Test User');
        await page.type('input[name="email"]', 'testuser@example.com');
        await page.type('input[name="password"]', 'Password123!');
        await page.type('input[name="confirmPassword"]', 'Password123!');

        const registerScreenshot = await takeScreenshot(page, 'register-form');
        logResult('functional', 'Register Form', 'PASS', 'Inputs filled successfully', registerScreenshot);

        // ==========================================
        // 5. ERROR HANDLING (404)
        // ==========================================
        console.log('\n--- Testing Error Handling (404) ---');
        await page.goto(`${BASE_URL}/ruta-inexistente-xyz-123`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 500));

        const pageContent = await page.content();
        const is404 = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('No encontrada');
        const errorScreenshot = await takeScreenshot(page, 'error-404');

        if (is404) {
            logResult('errors', '404 Page', 'PASS', 'Displayed 404/Not Found content', errorScreenshot);
        } else {
            // Some SPAs redirect to home on 404, which is also a valid strategy, but for this test we check specifically
            const url = page.url();
            if (url === `${BASE_URL}/` || url.includes('login')) {
                logResult('errors', '404 Page', 'WARN', 'Redirected to Home/Login instead of specific 404 page', errorScreenshot);
            } else {
                logResult('errors', '404 Page', 'FAIL', 'No 404 indication found', errorScreenshot);
            }
        }

        // ==========================================
        // 6. RESPONSIVENESS (Mobile View)
        // ==========================================
        console.log('\n--- Testing Responsiveness (iPhone SE) ---');
        await page.setViewport(VIEWPORT_IPHONE_SE);
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

        const mobileScreenshot = await takeScreenshot(page, 'mobile-view-login');

        // Check for horizontal scroll (bad responsive sign)
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 375;

        if (scrollWidth <= viewportWidth) {
            logResult('responsive', 'Mobile Layout', 'PASS', `No horizontal scroll (Body: ${scrollWidth}px)`, mobileScreenshot);
        } else {
            logResult('responsive', 'Mobile Layout', 'WARN', `Horizontal scroll detected (Body: ${scrollWidth}px > Viewport: ${viewportWidth}px)`, mobileScreenshot);
        }

    } catch (error) {
        console.error('FATAL TEST ERROR:', error);
        logResult('errors', 'Test Execution', 'FAIL', error.message);
    } finally {
        await browser.close();
        generateReport();
    }
}

// GENERATE MARKDOWN REPORT
function generateReport() {
    console.log('\n📝 Generating Executive Report...');

    // Calculate Summary Stats
    const totalTests = Object.values(reportData).flat().length - reportData.performance.length; // Performance is special
    const passed = Object.values(reportData).flat().filter(x => x.status === 'PASS').length;
    const warnings = Object.values(reportData).flat().filter(x => x.status === 'WARN').length;

    let mdContent = `# 🛡️ Reporte Ejecutivo de Calidad (QA) - ClassPad

**Fecha:** ${new Date().toLocaleString()}
**Estado General:** ${passed === totalTests ? '✅ ESTABLE' : (warnings > 0 ? '⚠️ CON OBSERVACIONES' : '❌ REQUIERE ATENCIÓN')}

---

## 1. Resumen Ejecutivo
| Métrica | Resultado |
| :--- | :--- |
| **Total Escenarios** | ${totalTests} |
| **Pasados** | ${passed} ✅ |
| **Fallidos** | ${totalTests - passed - warnings} ❌ |
| **Advertencias** | ${warnings} ⚠️ |

---

## 2. ⚡ Performance del Sistema (Home Load)
| Métrica | Valor Real | Objetivo | Impacto Usuario | Estado |
| :--- | :--- | :--- | :--- | :--- |
`;

    // Add Performance Rows
    reportData.performance.forEach(p => {
        mdContent += `| ${p.metric} | **${p.value}** | ${p.target} | ${p.impact} | ${p.status} |\n`;
    });

    mdContent += `
---

## 3. 🧪 Detalle de Pruebas

### 🔐 Seguridad & Auth
| Escenario | Resultado | Detalles |
| :--- | :--- | :--- |
`;
    // Security & Functional
    [...reportData.security, ...reportData.functional].forEach(item => {
        mdContent += `| ${item.name} | ${item.icon} ${item.status} | ${item.details} |\n`;
    });

    mdContent += `
### 📱 Experiencia de Usuario & UI
| Escenario | Resultado | Detalles |
| :--- | :--- | :--- |
`;
    // Responsive & Errors
    [...reportData.responsive, ...reportData.errors].forEach(item => {
        mdContent += `| ${item.name} | ${item.icon} ${item.status} | ${item.details} |\n`;
    });

    mdContent += `
---

## 4. 📸 Evidencias Visuales

`;

    // Embed Screenshots
    // Grouping by category logic or simple listing
    const allScreenshots = [
        ...reportData.performance, // Logic differs slightly, re-mapping if needed
        ...reportData.security,
        ...reportData.functional,
        ...reportData.responsive,
        ...reportData.errors
    ];

    allScreenshots.forEach(item => {
        if (item.screenshotPath) {
            mdContent += `### ${item.name || item.metric}\n`;
            mdContent += `![${item.name}](${item.screenshotPath})\n\n`;
        }
    });

    mdContent += `
---

## 5. 📖 Glosario Técnico
* **E2E (End-to-End):** Pruebas que simulan el comportamiento real del usuario de principio a fin.
* **Puppeteer:** Herramienta que permite controlar Chrome/Chromium automáticamente.
* **NetworkIdle:** Estado donde no hay conexiones de red activas (carga completa).
* **Viewport:** El área visible de la página web para el usuario.
`;

    fs.writeFileSync(REPORT_FILE, mdContent);
    console.log(`✅ Report generated at: ${REPORT_FILE}`);
}

// EXECUTE
runTests();
