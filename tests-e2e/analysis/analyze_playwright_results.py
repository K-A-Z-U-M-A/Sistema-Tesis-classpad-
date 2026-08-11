#!/usr/bin/env python3
"""
analyze_playwright_results.py
===============================
Procesa los resultados de las pruebas E2E de Playwright (playwright-report/results.json
y test-results/metrics/performance-metrics.json) y genera tres figuras académicas a 300 DPI:

  Figura 1 – Tiempos de Respuesta por Funcionalidad Evaluada
             (barras horizontales, mayor → menor)
  Figura 2 – Resultados por Módulo de la Aplicación
             (barras de cobertura: pass / fail / skip por módulo)
  Figura 3 – Distribución de Frecuencias de Tiempos de Respuesta
             (histograma con línea de media aritmética y umbral de 3 s)

Salidas:
  analysis/figura1_tiempos_respuesta.png  (300 DPI)
  analysis/figura2_resultados_modulo.png  (300 DPI)
  analysis/figura3_histograma.png         (300 DPI)
  analysis/resumen_estadistico.json
  analysis/resumen_estadistico.md
  analysis/resumen_estadistico.csv

Uso:
  python analysis/analyze_playwright_results.py \
      --metrics test-results/metrics/performance-metrics.json \
      --results playwright-report/results.json \
      --output analysis/
"""

import sys
import os
import argparse
import json
import csv
from datetime import datetime
from pathlib import Path

# En Windows la consola puede usar cp1252 por defecto; reconfiguramos a UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
import matplotlib
matplotlib.use('Agg')          # sin GUI
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.ticker import MultipleLocator

# ─────────────────────────────────────────────────────────────────────────────
# Configuración de estilo académico
# ─────────────────────────────────────────────────────────────────────────────
COLORS = {
    'primary':  '#1A73E8',
    'success':  '#34A853',
    'warning':  '#FBBC04',
    'danger':   '#EA4335',
    'neutral':  '#9AA0A6',
    'bg':       '#FFFFFF',
    'grid':     '#E8EAED',
}

plt.rcParams.update({
    'font.family':      'DejaVu Sans',
    'font.size':        10,
    'axes.titlesize':   13,
    'axes.labelsize':   11,
    'axes.titleweight': 'bold',
    'axes.spines.top':  False,
    'axes.spines.right': False,
    'axes.grid':        True,
    'grid.color':       COLORS['grid'],
    'grid.linewidth':   0.8,
    'figure.dpi':       300,
    'savefig.dpi':      300,
    'savefig.bbox':     'tight',
    'figure.facecolor': COLORS['bg'],
    'axes.facecolor':   COLORS['bg'],
})

THRESHOLD_S = 3.0   # umbral de aceptación de tiempo de respuesta (segundos)

# ─────────────────────────────────────────────────────────────────────────────
# Carga de datos
# ─────────────────────────────────────────────────────────────────────────────

def load_metrics(metrics_path: str) -> list[dict]:
    """Carga las métricas de rendimiento registradas por metrics.helper.js."""
    path = Path(metrics_path)
    if not path.exists():
        print(f"⚠️  Archivo de métricas no encontrado: {metrics_path}")
        print("    Se usarán datos de ejemplo para demostración.")
        return _demo_metrics()
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def load_playwright_results(results_path: str) -> dict:
    """Carga el JSON de reporte de Playwright (results.json)."""
    candidate_paths = [
        Path(results_path),
        Path('reports/results.json'),
        Path('playwright-report/results.json'),
        Path('tests-e2e/reports/results.json'),
    ]
    for path in candidate_paths:
        if path.exists():
            with open(path, encoding='utf-8') as f:
                return json.load(f)

    print(f"⚠️  Archivo de resultados Playwright no encontrado en: {results_path}")
    return {}


def _demo_metrics() -> list[dict]:
    """Datos de demostración cuando no hay ejecución real previa."""
    demo = [
        ('Login exitoso - admin',           'Autenticación',    'Clic en Ingresar',              820),
        ('Login exitoso - teacher',          'Autenticación',    'Clic en Ingresar',              910),
        ('Login exitoso - student',          'Autenticación',    'Clic en Ingresar',              870),
        ('Login fallido',                    'Autenticación',    'Clic en Ingresar (inválido)',   780),
        ('Cierre de sesión',                 'Autenticación',    'Clic en Cerrar sesión',         640),
        ('Listar usuarios',                  'Administración',   'Carga de tabla de usuarios',   1120),
        ('Buscar usuario',                   'Administración',   'Búsqueda por nombre',           950),
        ('Ver detalle de usuario',           'Administración',   'Apertura de detalle',           880),
        ('Listar cursos del profesor',       'Cursos',           'Carga de lista de cursos',     1380),
        ('Detalle de curso',                 'Cursos',           'Apertura de detalle de curso', 1150),
        ('Sección alumnos en curso',         'Cursos',           'Visibilidad de alumnos',        930),
        ('Listar tareas',                    'Tareas',           'Carga de lista de tareas',     1560),
        ('Crear nueva tarea - formulario',   'Tareas',           'Apertura de formulario',        720),
        ('Ver entregas de tarea',            'Tareas',           'Apertura de entregas',         1840),
        ('Ver cursos disponibles',           'Inscripciones',    'Carga de catálogo',            1290),
        ('Mis inscripciones',                'Inscripciones',    'Carga de inscripciones',       1180),
        ('Ver tareas pendientes',            'Entregas',         'Carga de tareas pendientes',   1420),
        ('Detalle de tarea',                 'Entregas',         'Apertura de detalle',           830),
        ('Formulario de entrega',            'Entregas',         'Visibilidad del formulario',    760),
        ('Carga módulo asistencia',          'Asistencia',       'Carga de página',              2100),
        ('Lista alumnos asistencia',         'Asistencia',       'Visibilidad de lista',         1750),
        ('Controles de asistencia',          'Asistencia',       'Controles presente/ausente',   1930),
        ('Libro de calificaciones',          'Calificaciones',   'Carga de libro',               2340),
        ('Filas de alumnos en calificaciones','Calificaciones',  'Conteo de alumnos',            2510),
        ('Calificaciones alumno',            'Calificaciones',   'Carga del alumno',             2180),
        ('Carga mensajes admin',             'Mensajes',         'Carga de página',              1640),
        ('Lista de conversaciones',          'Mensajes',         'Panel de conversaciones',      1420),
        ('Carga mensajes profesor',          'Mensajes',         'Carga (profesor)',             1580),
        ('Área de redacción',                'Mensajes',         'Campo de redacción',            690),
        ('Tabla de logs auditoría',          'Reportes',         'Carga de logs',                2870),
        ('[Desktop] Dashboard',              'Responsividad',    'Carga 1280×720',               1120),
        ('[Tablet] Dashboard',               'Responsividad',    'Carga 768×1024',               1380),
        ('[Móvil] Dashboard',                'Responsividad',    'Carga 390×844',                1540),
        ('Accesibilidad Login',              'Accesibilidad',    'Análisis axe-core',             980),
        ('Accesibilidad Dashboard',          'Accesibilidad',    'Análisis axe-core',            1210),
    ]
    return [
        {
            'scenario': s, 'module': m, 'action': a,
            'durationMs': d, 'durationSec': round(d / 1000, 3),
            'status': 'pass', 'timestamp': datetime.now().isoformat(),
        }
        for s, m, a, d in demo
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Figura 1 – Tiempos de Respuesta por Funcionalidad
# ─────────────────────────────────────────────────────────────────────────────

def figura1_tiempos_respuesta(metrics: list[dict], output_dir: Path):
    """Barras horizontales: tiempo de respuesta por escenario (mayor → menor)."""
    data = [(m['scenario'], m['durationSec']) for m in metrics if 'durationSec' in m]
    if not data:
        print("⚠️  Sin datos para Figura 1.")
        return

    # Ordenar de mayor a menor y tomar los 20 más lentos si son muchos
    data.sort(key=lambda x: x[1], reverse=True)
    if len(data) > 20:
        data = data[:20]

    labels   = [d[0] for d in data]
    values   = [d[1] for d in data]
    colors   = [COLORS['danger'] if v > THRESHOLD_S else COLORS['primary'] for v in values]

    fig, ax = plt.subplots(figsize=(12, max(6, len(labels) * 0.42)))

    bars = ax.barh(range(len(labels)), values, color=colors, edgecolor='none', height=0.65)

    # Umbral en 3 s
    ax.axvline(THRESHOLD_S, color=COLORS['warning'], linewidth=1.5,
               linestyle='--', label=f'Umbral aceptable ({THRESHOLD_S} s)')

    # Etiquetas de valor
    for bar, val in zip(bars, values):
        ax.text(val + 0.03, bar.get_y() + bar.get_height() / 2,
                f'{val:.2f} s', va='center', fontsize=8, color='#202124')

    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels(labels, fontsize=8.5)
    ax.set_xlabel('Tiempo de respuesta (segundos)', fontsize=11)
    ax.set_title('Figura 1. Tiempos de Respuesta por Funcionalidad Evaluada', pad=14)
    ax.set_xlim(0, max(values) * 1.18)
    ax.xaxis.set_minor_locator(MultipleLocator(0.5))

    legend_patches = [
        mpatches.Patch(color=COLORS['primary'], label='Dentro del umbral'),
        mpatches.Patch(color=COLORS['danger'],  label='Supera el umbral'),
        mpatches.Patch(color=COLORS['warning'], label=f'Umbral ({THRESHOLD_S} s)', linestyle='--', fill=False),
    ]
    ax.legend(handles=legend_patches, loc='lower right', fontsize=9)

    plt.tight_layout()
    out = output_dir / 'figura1_tiempos_respuesta.png'
    plt.savefig(out)
    plt.close()
    print(f"✅ Figura 1 guardada → {out}")


# ─────────────────────────────────────────────────────────────────────────────
# Figura 2 – Resultados por Módulo de la Aplicación
# ─────────────────────────────────────────────────────────────────────────────

def figura2_resultados_modulo(metrics: list[dict], pw_results: dict, output_dir: Path):
    """Barras agrupadas: pass / fail / skip por módulo."""

    # Intentar extraer de playwright results
    module_stats: dict[str, dict] = {}

    if pw_results and 'suites' in pw_results:
        for suite in pw_results.get('suites', []):
            _extract_suite_stats(suite, module_stats)

    # Fallback: usar las métricas de rendimiento por módulo
    if not module_stats:
        for m in metrics:
            mod = m.get('module', 'Sin módulo')
            if mod not in module_stats:
                module_stats[mod] = {'pass': 0, 'fail': 0, 'skip': 0}
            status = m.get('status', 'pass')
            if status in ('pass', 'fail', 'skip'):
                module_stats[mod][status] += 1
            else:
                module_stats[mod]['pass'] += 1

    if not module_stats:
        print("⚠️  Sin datos para Figura 2.")
        return

    modules  = list(module_stats.keys())
    passes   = [module_stats[m]['pass'] for m in modules]
    fails    = [module_stats[m]['fail'] for m in modules]
    skips    = [module_stats[m]['skip'] for m in modules]

    x   = np.arange(len(modules))
    w   = 0.26

    fig, ax = plt.subplots(figsize=(12, 6))
    b1 = ax.bar(x - w, passes, w, label='Pasaron', color=COLORS['success'], edgecolor='none')
    b2 = ax.bar(x,     fails,  w, label='Fallaron', color=COLORS['danger'],  edgecolor='none')
    b3 = ax.bar(x + w, skips,  w, label='Omitidas', color=COLORS['neutral'], edgecolor='none')

    for bars in (b1, b2, b3):
        for bar in bars:
            h = bar.get_height()
            if h > 0:
                ax.text(bar.get_x() + bar.get_width() / 2, h + 0.1,
                        str(int(h)), ha='center', va='bottom', fontsize=8)

    ax.set_xticks(x)
    ax.set_xticklabels(modules, rotation=25, ha='right', fontsize=9)
    ax.set_ylabel('Cantidad de pruebas')
    ax.set_title('Figura 2. Resultados por Módulo de la Aplicación', pad=14)
    ax.legend(fontsize=9)
    ax.set_ylim(0, max(max(passes, default=1), 1) * 1.25)

    plt.tight_layout()
    out = output_dir / 'figura2_resultados_modulo.png'
    plt.savefig(out)
    plt.close()
    print(f"✅ Figura 2 guardada → {out}")


def _extract_suite_stats(suite: dict, stats: dict):
    """Recorre recursivamente las suites de Playwright para extraer resultados."""
    title = suite.get('title', 'Sin módulo')
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            mod = _infer_module(title)
            if mod not in stats:
                stats[mod] = {'pass': 0, 'fail': 0, 'skip': 0}
            status = test.get('status', 'pass')
            if status in stats[mod]:
                stats[mod][status] += 1
            else:
                stats[mod]['pass'] += 1
    for child in suite.get('suites', []):
        _extract_suite_stats(child, stats)


def _infer_module(title: str) -> str:
    """Infiere el módulo a partir del título de la suite."""
    mapping = {
        'auth': 'Autenticación', 'autenticación': 'Autenticación',
        'admin': 'Administración', 'usuarios': 'Administración',
        'curso': 'Cursos', 'course': 'Cursos',
        'tarea': 'Tareas', 'assignment': 'Tareas',
        'inscrip': 'Inscripciones', 'enrollment': 'Inscripciones',
        'entrega': 'Entregas', 'submission': 'Entregas',
        'asistencia': 'Asistencia', 'attendance': 'Asistencia',
        'calificac': 'Calificaciones', 'grade': 'Calificaciones',
        'mensaje': 'Mensajes', 'message': 'Mensajes',
        'reporte': 'Reportes', 'audit': 'Reportes',
        'validac': 'Validación', 'error': 'Validación',
        'responsiv': 'Responsividad', 'responsive': 'Responsividad',
        'accesib': 'Accesibilidad', 'accessibility': 'Accesibilidad',
    }
    title_lower = title.lower()
    for key, value in mapping.items():
        if key in title_lower:
            return value
    return title[:30]


# ─────────────────────────────────────────────────────────────────────────────
# Figura 3 – Histograma de distribución de frecuencias
# ─────────────────────────────────────────────────────────────────────────────

def figura3_histograma(metrics: list[dict], output_dir: Path):
    """Histograma de tiempos de respuesta + línea de media + umbral 3 s."""
    durations = [m['durationSec'] for m in metrics if 'durationSec' in m and m.get('status') != 'info']
    if not durations:
        print("⚠️  Sin datos para Figura 3.")
        return

    arr  = np.array(durations)
    mean = np.mean(arr)
    med  = np.median(arr)
    std  = np.std(arr)

    fig, ax = plt.subplots(figsize=(11, 6))

    n, bins, patches = ax.hist(
        arr, bins=15, color=COLORS['primary'], edgecolor='white',
        alpha=0.85, linewidth=0.6
    )

    # Colorear barras que superan el umbral
    for patch, left in zip(patches, bins[:-1]):
        if left >= THRESHOLD_S:
            patch.set_facecolor(COLORS['danger'])
            patch.set_alpha(0.85)

    # Línea de media
    ax.axvline(mean, color=COLORS['success'], linewidth=2,
               linestyle='-', label=f'Media aritmética: {mean:.3f} s')
    # Línea de mediana
    ax.axvline(med, color=COLORS['primary'], linewidth=1.5,
               linestyle=':', label=f'Mediana: {med:.3f} s')
    # Umbral de 3 s
    ax.axvline(THRESHOLD_S, color=COLORS['warning'], linewidth=2,
               linestyle='--', label=f'Umbral límite: {THRESHOLD_S} s')

    ax.set_xlabel('Tiempo de respuesta (segundos)', fontsize=11)
    ax.set_ylabel('Frecuencia (cantidad de mediciones)', fontsize=11)
    ax.set_title(
        'Figura 3. Distribución de Frecuencias de los Tiempos de Respuesta del Sistema',
        pad=14
    )
    ax.legend(fontsize=9.5)

    # Caja de estadísticas
    stats_text = (
        f'n = {len(arr)}\n'
        f'μ = {mean:.3f} s\n'
        f'Md = {med:.3f} s\n'
        f'σ = {std:.3f} s\n'
        f'Mín = {arr.min():.3f} s\n'
        f'Máx = {arr.max():.3f} s'
    )
    ax.text(0.97, 0.97, stats_text, transform=ax.transAxes, fontsize=8.5,
            va='top', ha='right',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#F8F9FA', alpha=0.9, edgecolor=COLORS['grid']))

    plt.tight_layout()
    out = output_dir / 'figura3_histograma.png'
    plt.savefig(out)
    plt.close()
    print(f"✅ Figura 3 guardada → {out}")

    return {'n': len(arr), 'mean': mean, 'median': med, 'std': std,
            'min': float(arr.min()), 'max': float(arr.max())}


# ─────────────────────────────────────────────────────────────────────────────
# Resumen estadístico
# ─────────────────────────────────────────────────────────────────────────────

def generar_resumen(metrics: list[dict], stats3: dict | None, output_dir: Path):
    """Genera resumen en JSON, Markdown y CSV."""
    durations = [m['durationSec'] for m in metrics if 'durationSec' in m and m.get('status') != 'info']
    arr = np.array(durations) if durations else np.array([0])

    total     = len(metrics)
    pasaron   = sum(1 for m in metrics if m.get('status') == 'pass')
    fallaron  = sum(1 for m in metrics if m.get('status') == 'fail')
    sobre_3s  = sum(1 for d in durations if d > THRESHOLD_S)

    resumen = {
        'fecha_analisis':     datetime.now().isoformat(),
        'total_mediciones':   total,
        'pasaron':            pasaron,
        'fallaron':           fallaron,
        'media_seg':          round(float(np.mean(arr)), 4),
        'mediana_seg':        round(float(np.median(arr)), 4),
        'desv_std_seg':       round(float(np.std(arr)), 4),
        'minimo_seg':         round(float(arr.min()), 4),
        'maximo_seg':         round(float(arr.max()), 4),
        'sobre_umbral_3s':    sobre_3s,
        'pct_sobre_umbral':   round(sobre_3s / len(durations) * 100, 1) if durations else 0,
    }

    # JSON
    json_out = output_dir / 'resumen_estadistico.json'
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(resumen, f, indent=2, ensure_ascii=False)
    print(f"✅ Resumen JSON  → {json_out}")

    # Markdown
    md_out = output_dir / 'resumen_estadistico.md'
    with open(md_out, 'w', encoding='utf-8') as f:
        f.write('# Resumen Estadístico – Pruebas E2E ClassPad\n\n')
        f.write(f'**Fecha de análisis:** {resumen["fecha_analisis"]}\n\n')
        f.write('| Métrica | Valor |\n|---|---|\n')
        f.write(f'| Total de mediciones | {resumen["total_mediciones"]} |\n')
        f.write(f'| Pruebas pasadas | {resumen["pasaron"]} |\n')
        f.write(f'| Pruebas fallidas | {resumen["fallaron"]} |\n')
        f.write(f'| Media aritmética (μ) | {resumen["media_seg"]} s |\n')
        f.write(f'| Mediana (Md) | {resumen["mediana_seg"]} s |\n')
        f.write(f'| Desviación estándar (σ) | {resumen["desv_std_seg"]} s |\n')
        f.write(f'| Tiempo mínimo | {resumen["minimo_seg"]} s |\n')
        f.write(f'| Tiempo máximo | {resumen["maximo_seg"]} s |\n')
        f.write(f'| Superan umbral de {THRESHOLD_S} s | {resumen["sobre_umbral_3s"]} ({resumen["pct_sobre_umbral"]}%) |\n')
    print(f"✅ Resumen MD    → {md_out}")

    # CSV
    csv_out = output_dir / 'resumen_estadistico.csv'
    with open(csv_out, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(resumen.keys()))
        writer.writeheader()
        writer.writerow(resumen)
    print(f"✅ Resumen CSV   → {csv_out}")

    # CSV con detalle de métricas
    detail_csv = output_dir / 'detalle_metricas.csv'
    if metrics:
        keys = ['timestamp', 'scenario', 'module', 'action', 'durationMs', 'durationSec', 'status']
        with open(detail_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(metrics)
        print(f"✅ Detalle CSV   → {detail_csv}")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Analiza resultados E2E de ClassPad y genera figuras académicas')
    parser.add_argument('--metrics', default='test-results/metrics/performance-metrics.json',
                        help='Ruta al archivo JSON de métricas de rendimiento')
    parser.add_argument('--results', default='playwright-report/results.json',
                        help='Ruta al archivo JSON de resultados de Playwright')
    parser.add_argument('--output', default='analysis',
                        help='Directorio de salida para figuras y reportes')
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print('\n🔬 ClassPad E2E – Análisis de Resultados\n' + '─' * 45)

    metrics    = load_metrics(args.metrics)
    pw_results = load_playwright_results(args.results)

    print(f'📊 Métricas cargadas: {len(metrics)} registros\n')

    figura1_tiempos_respuesta(metrics, output_dir)
    figura2_resultados_modulo(metrics, pw_results, output_dir)
    stats3 = figura3_histograma(metrics, output_dir)
    generar_resumen(metrics, stats3, output_dir)

    print('\n✅ Análisis completo. Figuras generadas en:', output_dir.resolve())


if __name__ == '__main__':
    main()
