-- ============================================================
-- Seed: Feriados Nacionales de Paraguay 2026
-- Fuente: Ley 3937/09 + Decretos presidenciales
-- ============================================================

-- Limpiar datos previos del año 2026 para evitar duplicados
DELETE FROM paraguay_holidays WHERE year = 2026;

INSERT INTO paraguay_holidays (name, original_date, effective_date, year, is_moved, move_reason, is_national) VALUES

-- Enero
('Año Nuevo',                   '2026-01-01', '2026-01-01', 2026, FALSE, NULL, TRUE),

-- Febrero
('Día de San Blas (Patrono de Paraguay)', '2026-02-03', '2026-02-03', 2026, FALSE, NULL, TRUE),
('Carnaval (Lunes)',            '2026-02-16', '2026-02-16', 2026, FALSE, NULL, TRUE),
('Carnaval (Martes)',           '2026-02-17', '2026-02-17', 2026, FALSE, NULL, TRUE),

-- Marzo
('Día de los Héroes de la Patria', '2026-03-01', '2026-03-02', 2026, TRUE, 'Trasladado al lunes más próximo (Ley 3937/09)', TRUE),

-- Abril (Semana Santa — fechas variables para 2026)
('Jueves Santo',                '2026-04-02', '2026-04-02', 2026, FALSE, NULL, TRUE),
('Viernes Santo',               '2026-04-03', '2026-04-03', 2026, FALSE, NULL, TRUE),

-- Mayo
('Día del Trabajador',          '2026-05-01', '2026-05-01', 2026, FALSE, NULL, TRUE),
('Independencia Nacional (25 de Mayo)', '2026-05-14', '2026-05-14', 2026, FALSE, NULL, TRUE),
('Independencia Nacional (15 de Mayo)', '2026-05-15', '2026-05-15', 2026, FALSE, NULL, TRUE),

-- Junio
('Paz del Chaco',               '2026-06-12', '2026-06-12', 2026, FALSE, NULL, TRUE),

-- Agosto
('Fundación de Asunción',       '2026-08-15', '2026-08-17', 2026, TRUE, 'Trasladado al lunes más próximo (Ley 3937/09)', TRUE),
('Constitución Nacional',       '2026-08-25', '2026-08-25', 2026, FALSE, NULL, TRUE),

-- Septiembre
('Victoria de Boquerón',        '2026-09-29', '2026-09-29', 2026, FALSE, NULL, TRUE),

-- Diciembre
('Virgen de Caacupé',           '2026-12-08', '2026-12-08', 2026, FALSE, NULL, TRUE),
('Navidad',                     '2026-12-25', '2026-12-25', 2026, FALSE, NULL, TRUE);

-- ============================================================
-- Seed: Feriados Nacionales de Paraguay 2025 (semestres en curso)
-- ============================================================
DELETE FROM paraguay_holidays WHERE year = 2025;

INSERT INTO paraguay_holidays (name, original_date, effective_date, year, is_moved, move_reason, is_national) VALUES

('Año Nuevo',                   '2025-01-01', '2025-01-01', 2025, FALSE, NULL, TRUE),
('Día de San Blas',             '2025-02-03', '2025-02-03', 2025, FALSE, NULL, TRUE),
('Carnaval (Lunes)',            '2025-03-03', '2025-03-03', 2025, FALSE, NULL, TRUE),
('Carnaval (Martes)',           '2025-03-04', '2025-03-04', 2025, FALSE, NULL, TRUE),
('Día de los Héroes',           '2025-03-01', '2025-03-03', 2025, TRUE, 'Trasladado al lunes más próximo', TRUE),
('Jueves Santo',                '2025-04-17', '2025-04-17', 2025, FALSE, NULL, TRUE),
('Viernes Santo',               '2025-04-18', '2025-04-18', 2025, FALSE, NULL, TRUE),
('Día del Trabajador',          '2025-05-01', '2025-05-01', 2025, FALSE, NULL, TRUE),
('Independencia Nacional (14)', '2025-05-14', '2025-05-14', 2025, FALSE, NULL, TRUE),
('Independencia Nacional (15)', '2025-05-15', '2025-05-15', 2025, FALSE, NULL, TRUE),
('Paz del Chaco',               '2025-06-12', '2025-06-12', 2025, FALSE, NULL, TRUE),
('Fundación de Asunción',       '2025-08-15', '2025-08-15', 2025, FALSE, NULL, TRUE),
('Constitución Nacional',       '2025-08-25', '2025-08-25', 2025, FALSE, NULL, TRUE),
('Victoria de Boquerón',        '2025-09-29', '2025-09-29', 2025, FALSE, NULL, TRUE),
('Virgen de Caacupé',           '2025-12-08', '2025-12-08', 2025, FALSE, NULL, TRUE),
('Navidad',                     '2025-12-25', '2025-12-25', 2025, FALSE, NULL, TRUE);
