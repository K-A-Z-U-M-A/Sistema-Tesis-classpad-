#!/usr/bin/env python3
"""
analyze_human_usability.py
============================
Procesa las respuestas del cuestionario SUS (System Usability Scale) completadas
por participantes reales en sesiones de evaluación de usabilidad.

Entrada:
  usability/sus-responses.csv   (completado por el evaluador tras las sesiones)

Salidas:
  analysis/sus_scores.json      - Puntuaciones individuales y puntuación global SUS
  analysis/sus_scores.md        - Tabla y análisis en Markdown (para la tesis)
  analysis/figura4_sus.png      - Gráfico de barras de puntuaciones SUS (300 DPI)

Fórmula SUS estándar (Brooke, 1996):
  - Ítems impares (1,3,5,7,9): posición - 1
  - Ítems pares  (2,4,6,8,10): 5 - posición
  - Suma de los 10 contribuciones × 2.5 → escala 0–100

Interpretación (Bangor et al., 2008):
  ≥ 90.9  → Excelente (A)
  ≥ 80.3  → Bien      (B)
  ≥ 71.1  → Bueno     (C)
  ≥ 60.9  → Regular   (D)
  ≥ 51.7  → Aceptable (F)
  < 51.7  → No aceptable

Uso:
  python analysis/analyze_human_usability.py \
      --input usability/sus-responses.csv \
      --output analysis/

ADVERTENCIA METODOLÓGICA: Este script procesa exclusivamente datos REALES
recopilados en sesiones controladas. NO genera ni imputa datos.
"""

import sys
import os
import argparse
import csv
import json
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ─────────────────────────────────────────────────────────────────────────────
# Configuración
# ─────────────────────────────────────────────────────────────────────────────

SUS_ITEMS = [
    'Creo que me gustaría usar este sistema frecuentemente.',
    'Encontré el sistema innecesariamente complejo.',
    'Pensé que el sistema era fácil de usar.',
    'Creo que necesitaría asistencia para usar este sistema.',
    'Las funciones del sistema estaban bien integradas.',
    'Pensé que había demasiada inconsistencia en el sistema.',
    'Imagino que la mayoría de personas aprenderían rápidamente.',
    'El sistema fue muy difícil de usar.',
    'Me sentí muy confiado usando el sistema.',
    'Necesité aprender muchas cosas antes de poder usarlo.',
]

SUS_SCALE = {
    90.9: 'Excelente (A)',
    80.3: 'Bien (B)',
    71.1: 'Bueno (C)',
    60.9: 'Regular (D)',
    51.7: 'Aceptable (F)',
    0:    'No aceptable',
}

COLORS = {
    'primary': '#1A73E8',
    'success': '#34A853',
    'warning': '#FBBC04',
    'danger':  '#EA4335',
    'neutral': '#9AA0A6',
    'bg':      '#FFFFFF',
    'grid':    '#E8EAED',
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
    'figure.dpi':       300,
    'savefig.dpi':      300,
    'savefig.bbox':     'tight',
    'figure.facecolor': COLORS['bg'],
    'axes.facecolor':   COLORS['bg'],
})

# ─────────────────────────────────────────────────────────────────────────────
# Cálculo SUS
# ─────────────────────────────────────────────────────────────────────────────

def calcular_sus(respuestas: list[int]) -> float:
    """
    Calcula la puntuación SUS (0-100) para un conjunto de 10 respuestas Likert (1-5).
    Ítems impares (índice 0,2,4,6,8): contribución = respuesta - 1
    Ítems pares  (índice 1,3,5,7,9): contribución = 5 - respuesta
    Suma total × 2.5
    """
    if len(respuestas) != 10:
        raise ValueError(f'Se esperan 10 respuestas, se recibieron {len(respuestas)}')
    total = 0
    for i, r in enumerate(respuestas):
        if i % 2 == 0:
            total += r - 1
        else:
            total += 5 - r
    return total * 2.5


def interpretar_sus(score: float) -> str:
    for threshold in sorted(SUS_SCALE.keys(), reverse=True):
        if score >= threshold:
            return SUS_SCALE[threshold]
    return 'No aceptable'


# ─────────────────────────────────────────────────────────────────────────────
# Carga de datos
# ─────────────────────────────────────────────────────────────────────────────

def cargar_respuestas(csv_path: str) -> list[dict]:
    """
    Lee el CSV de respuestas SUS.
    Formato esperado (ver usability/sus-responses-template.csv):
      participante_id, rol, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, observaciones
    """
    path = Path(csv_path)
    if not path.exists():
        print(f'\n⛔  Archivo de respuestas no encontrado: {csv_path}')
        print('    Complete las sesiones de usabilidad y registre las respuestas en:')
        print(f'    {csv_path}')
        print('    Usando como plantilla: usability/sus-responses-template.csv\n')
        sys.exit(1)

    participantes = []
    with open(path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            try:
                respuestas = [int(row[f'q{j}']) for j in range(1, 11)]
                # Validar rango Likert 1-5
                for j, r in enumerate(respuestas, 1):
                    if r < 1 or r > 5:
                        raise ValueError(f'Respuesta fuera de rango [1-5] en ítem q{j}: {r}')
                participantes.append({
                    'id':            row.get('participante_id', f'P{i:02d}'),
                    'rol':           row.get('rol', 'Sin especificar'),
                    'respuestas':    respuestas,
                    'observaciones': row.get('observaciones', ''),
                })
            except (KeyError, ValueError) as e:
                print(f'⚠️  Error en fila {i}: {e}. Fila omitida.')
                continue

    if not participantes:
        print('⛔  No se encontraron respuestas válidas en el CSV.')
        sys.exit(1)

    return participantes


# ─────────────────────────────────────────────────────────────────────────────
# Análisis y reportes
# ─────────────────────────────────────────────────────────────────────────────

def analizar_sus(participantes: list[dict], output_dir: Path):
    resultados = []
    for p in participantes:
        score = calcular_sus(p['respuestas'])
        resultados.append({
            'id':            p['id'],
            'rol':           p['rol'],
            'respuestas':    p['respuestas'],
            'sus_score':     round(score, 2),
            'interpretacion': interpretar_sus(score),
            'observaciones': p['observaciones'],
        })

    scores = np.array([r['sus_score'] for r in resultados])
    promedio_sus = float(np.mean(scores))

    analisis = {
        'fecha_analisis':     datetime.now().isoformat(),
        'n_participantes':    len(resultados),
        'sus_promedio':       round(promedio_sus, 2),
        'sus_mediana':        round(float(np.median(scores)), 2),
        'sus_std':            round(float(np.std(scores)), 2),
        'sus_min':            round(float(scores.min()), 2),
        'sus_max':            round(float(scores.max()), 2),
        'interpretacion_global': interpretar_sus(promedio_sus),
        'resultados_individuales': resultados,
    }

    # ── JSON ─────────────────────────────────────────────────────────────────
    json_out = output_dir / 'sus_scores.json'
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(analisis, f, indent=2, ensure_ascii=False)
    print(f'✅ JSON SUS  → {json_out}')

    # ── Markdown ─────────────────────────────────────────────────────────────
    md_out = output_dir / 'sus_scores.md'
    with open(md_out, 'w', encoding='utf-8') as f:
        f.write('# Resultados de la Evaluación SUS – ClassPad\n\n')
        f.write(f'**Fecha:** {analisis["fecha_analisis"]}\n\n')
        f.write(f'**Participantes:** {analisis["n_participantes"]}\n\n')
        f.write('## Puntuación Global\n\n')
        f.write(f'| Estadístico | Valor |\n|---|---|\n')
        f.write(f'| Promedio SUS (μ) | **{analisis["sus_promedio"]}** |\n')
        f.write(f'| Mediana | {analisis["sus_mediana"]} |\n')
        f.write(f'| Desviación estándar (σ) | {analisis["sus_std"]} |\n')
        f.write(f'| Mínimo | {analisis["sus_min"]} |\n')
        f.write(f'| Máximo | {analisis["sus_max"]} |\n')
        f.write(f'| Interpretación global | **{analisis["interpretacion_global"]}** |\n\n')
        f.write('## Puntuaciones Individuales\n\n')
        f.write('| ID | Rol | Puntaje SUS | Interpretación |\n|---|---|---|---|\n')
        for r in resultados:
            f.write(f'| {r["id"]} | {r["rol"]} | {r["sus_score"]} | {r["interpretacion"]} |\n')
        f.write('\n## Escala de Interpretación (Bangor et al., 2008)\n\n')
        f.write('| Rango | Adjetivo | Grado |\n|---|---|---|\n')
        f.write('| ≥ 90.9 | Excelente | A |\n')
        f.write('| 80.3–90.8 | Bien | B |\n')
        f.write('| 71.1–80.2 | Bueno | C |\n')
        f.write('| 60.9–71.0 | Regular | D |\n')
        f.write('| 51.7–60.8 | Aceptable | F |\n')
        f.write('| < 51.7 | No aceptable | — |\n')
    print(f'✅ MD SUS    → {md_out}')

    # ── Figura 4 ─────────────────────────────────────────────────────────────
    _figura4_sus(resultados, promedio_sus, output_dir)

    return analisis


def _figura4_sus(resultados: list[dict], promedio: float, output_dir: Path):
    ids    = [r['id'] for r in resultados]
    scores = [r['sus_score'] for r in resultados]

    colors = []
    for s in scores:
        if s >= 80.3:
            colors.append(COLORS['success'])
        elif s >= 71.1:
            colors.append(COLORS['primary'])
        elif s >= 51.7:
            colors.append(COLORS['warning'])
        else:
            colors.append(COLORS['danger'])

    fig, ax = plt.subplots(figsize=(max(8, len(ids) * 1.1), 6))
    bars = ax.bar(ids, scores, color=colors, edgecolor='none', width=0.6)

    # Línea de promedio
    ax.axhline(promedio, color='#202124', linewidth=1.8, linestyle='--',
               label=f'Promedio SUS: {promedio:.1f}')
    # Umbral "aceptable" (71.1 = Bueno)
    ax.axhline(71.1, color=COLORS['warning'], linewidth=1.2, linestyle=':',
               label='Umbral "Bueno" (71.1)')

    for bar, val in zip(bars, scores):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.8,
                f'{val:.1f}', ha='center', va='bottom', fontsize=9, fontweight='bold')

    ax.set_ylim(0, 105)
    ax.set_xlabel('Participante', fontsize=11)
    ax.set_ylabel('Puntuación SUS (0–100)', fontsize=11)
    ax.set_title('Figura 4. Puntuaciones SUS por Participante – Evaluación de Usabilidad ClassPad', pad=14)
    ax.legend(fontsize=9)

    legend_patches = [
        mpatches.Patch(color=COLORS['success'], label='Bien / Excelente (≥ 80.3)'),
        mpatches.Patch(color=COLORS['primary'], label='Bueno (71.1–80.2)'),
        mpatches.Patch(color=COLORS['warning'], label='Regular / Aceptable (51.7–71.0)'),
        mpatches.Patch(color=COLORS['danger'],  label='No aceptable (< 51.7)'),
    ]
    ax.legend(handles=legend_patches + [
        mpatches.Patch(color='#202124', label=f'Promedio: {promedio:.1f}', fill=False, linestyle='--')
    ], fontsize=8.5, loc='lower right')

    plt.tight_layout()
    out = output_dir / 'figura4_sus.png'
    plt.savefig(out)
    plt.close()
    print(f'✅ Figura 4  → {out}')


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Calcula puntuaciones SUS y genera figuras académicas a 300 DPI'
    )
    parser.add_argument('--input',  default='usability/sus-responses.csv',
                        help='Ruta al CSV de respuestas SUS reales')
    parser.add_argument('--output', default='analysis',
                        help='Directorio de salida para figuras y reportes')
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print('\n📋 ClassPad – Análisis de Usabilidad SUS\n' + '─' * 45)
    print('⚠️  IMPORTANTE: Este script procesa exclusivamente datos REALES.')
    print('   No ejecutar sin haber completado las sesiones de evaluación.\n')

    participantes = cargar_respuestas(args.input)
    print(f'👥 Participantes cargados: {len(participantes)}\n')

    analisis = analizar_sus(participantes, output_dir)

    print(f'\n🎯 Puntuación SUS promedio: {analisis["sus_promedio"]} / 100')
    print(f'   Interpretación: {analisis["interpretacion_global"]}')
    print(f'\n✅ Análisis SUS completo. Reportes en: {output_dir.resolve()}')


if __name__ == '__main__':
    main()
