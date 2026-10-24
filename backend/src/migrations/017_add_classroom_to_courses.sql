-- ========================================
-- MIGRACIÓN 017: Asignación de Aulas a Cursos
-- ========================================
-- Agrega los campos de aula (pabellón, piso, número) a la tabla courses
-- y crea la tabla de referencia de aulas disponibles.

-- 1. AGREGAR CAMPOS DE AULA A COURSES
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS classroom_pavilion INTEGER CHECK (classroom_pavilion IN (1, 2)),
ADD COLUMN IF NOT EXISTS classroom_floor    VARCHAR(3)  CHECK (classroom_floor IN ('PB','1','2','3','4','5')),
ADD COLUMN IF NOT EXISTS classroom_number   INTEGER CHECK (classroom_number BETWEEN 1 AND 10);

COMMENT ON COLUMN courses.classroom_pavilion IS 'Pabellón donde se dicta el curso (1 o 2)';
COMMENT ON COLUMN courses.classroom_floor    IS 'Piso del aula: PB (planta baja), 1, 2, 3, 4 o 5';
COMMENT ON COLUMN courses.classroom_number   IS 'Número de aula dentro del piso (1 a 10)';

-- Índice para búsqueda rápida de conflictos de aula
CREATE INDEX IF NOT EXISTS idx_courses_classroom
    ON courses(classroom_pavilion, classroom_floor, classroom_number, turn, year, semester)
    WHERE archived = false;

-- 2. CREAR TABLA DE REFERENCIA: classrooms
-- Contiene los 120 aulas posibles: 2 pabellones × 6 pisos × 10 aulas
CREATE TABLE IF NOT EXISTS classrooms (
    id         SERIAL PRIMARY KEY,
    pavilion   INTEGER     NOT NULL CHECK (pavilion IN (1, 2)),
    floor      VARCHAR(3)  NOT NULL CHECK (floor IN ('PB','1','2','3','4','5')),
    number     INTEGER     NOT NULL CHECK (number BETWEEN 1 AND 10),
    label      VARCHAR(50) NOT NULL,  -- Etiqueta legible, ej: "Pab. 1 – PB – Aula 3"
    UNIQUE (pavilion, floor, number)
);

COMMENT ON TABLE classrooms IS 'Catálogo de aulas disponibles: 2 pabellones × 6 pisos × 10 aulas = 120 aulas';

-- 3. POBLAR LA TABLA classrooms CON LAS 120 AULAS
-- Se usa INSERT ... ON CONFLICT DO NOTHING para ser idempotente
INSERT INTO classrooms (pavilion, floor, number, label) VALUES
-- Pabellón 1 – Planta Baja
(1,'PB',1, 'Pab. 1 – Planta Baja – Aula 1'),
(1,'PB',2, 'Pab. 1 – Planta Baja – Aula 2'),
(1,'PB',3, 'Pab. 1 – Planta Baja – Aula 3'),
(1,'PB',4, 'Pab. 1 – Planta Baja – Aula 4'),
(1,'PB',5, 'Pab. 1 – Planta Baja – Aula 5'),
(1,'PB',6, 'Pab. 1 – Planta Baja – Aula 6'),
(1,'PB',7, 'Pab. 1 – Planta Baja – Aula 7'),
(1,'PB',8, 'Pab. 1 – Planta Baja – Aula 8'),
(1,'PB',9, 'Pab. 1 – Planta Baja – Aula 9'),
(1,'PB',10,'Pab. 1 – Planta Baja – Aula 10'),
-- Pabellón 1 – Piso 1
(1,'1',1, 'Pab. 1 – Piso 1 – Aula 1'),
(1,'1',2, 'Pab. 1 – Piso 1 – Aula 2'),
(1,'1',3, 'Pab. 1 – Piso 1 – Aula 3'),
(1,'1',4, 'Pab. 1 – Piso 1 – Aula 4'),
(1,'1',5, 'Pab. 1 – Piso 1 – Aula 5'),
(1,'1',6, 'Pab. 1 – Piso 1 – Aula 6'),
(1,'1',7, 'Pab. 1 – Piso 1 – Aula 7'),
(1,'1',8, 'Pab. 1 – Piso 1 – Aula 8'),
(1,'1',9, 'Pab. 1 – Piso 1 – Aula 9'),
(1,'1',10,'Pab. 1 – Piso 1 – Aula 10'),
-- Pabellón 1 – Piso 2
(1,'2',1, 'Pab. 1 – Piso 2 – Aula 1'),
(1,'2',2, 'Pab. 1 – Piso 2 – Aula 2'),
(1,'2',3, 'Pab. 1 – Piso 2 – Aula 3'),
(1,'2',4, 'Pab. 1 – Piso 2 – Aula 4'),
(1,'2',5, 'Pab. 1 – Piso 2 – Aula 5'),
(1,'2',6, 'Pab. 1 – Piso 2 – Aula 6'),
(1,'2',7, 'Pab. 1 – Piso 2 – Aula 7'),
(1,'2',8, 'Pab. 1 – Piso 2 – Aula 8'),
(1,'2',9, 'Pab. 1 – Piso 2 – Aula 9'),
(1,'2',10,'Pab. 1 – Piso 2 – Aula 10'),
-- Pabellón 1 – Piso 3
(1,'3',1, 'Pab. 1 – Piso 3 – Aula 1'),
(1,'3',2, 'Pab. 1 – Piso 3 – Aula 2'),
(1,'3',3, 'Pab. 1 – Piso 3 – Aula 3'),
(1,'3',4, 'Pab. 1 – Piso 3 – Aula 4'),
(1,'3',5, 'Pab. 1 – Piso 3 – Aula 5'),
(1,'3',6, 'Pab. 1 – Piso 3 – Aula 6'),
(1,'3',7, 'Pab. 1 – Piso 3 – Aula 7'),
(1,'3',8, 'Pab. 1 – Piso 3 – Aula 8'),
(1,'3',9, 'Pab. 1 – Piso 3 – Aula 9'),
(1,'3',10,'Pab. 1 – Piso 3 – Aula 10'),
-- Pabellón 1 – Piso 4
(1,'4',1, 'Pab. 1 – Piso 4 – Aula 1'),
(1,'4',2, 'Pab. 1 – Piso 4 – Aula 2'),
(1,'4',3, 'Pab. 1 – Piso 4 – Aula 3'),
(1,'4',4, 'Pab. 1 – Piso 4 – Aula 4'),
(1,'4',5, 'Pab. 1 – Piso 4 – Aula 5'),
(1,'4',6, 'Pab. 1 – Piso 4 – Aula 6'),
(1,'4',7, 'Pab. 1 – Piso 4 – Aula 7'),
(1,'4',8, 'Pab. 1 – Piso 4 – Aula 8'),
(1,'4',9, 'Pab. 1 – Piso 4 – Aula 9'),
(1,'4',10,'Pab. 1 – Piso 4 – Aula 10'),
-- Pabellón 1 – Piso 5
(1,'5',1, 'Pab. 1 – Piso 5 – Aula 1'),
(1,'5',2, 'Pab. 1 – Piso 5 – Aula 2'),
(1,'5',3, 'Pab. 1 – Piso 5 – Aula 3'),
(1,'5',4, 'Pab. 1 – Piso 5 – Aula 4'),
(1,'5',5, 'Pab. 1 – Piso 5 – Aula 5'),
(1,'5',6, 'Pab. 1 – Piso 5 – Aula 6'),
(1,'5',7, 'Pab. 1 – Piso 5 – Aula 7'),
(1,'5',8, 'Pab. 1 – Piso 5 – Aula 8'),
(1,'5',9, 'Pab. 1 – Piso 5 – Aula 9'),
(1,'5',10,'Pab. 1 – Piso 5 – Aula 10'),
-- Pabellón 2 – Planta Baja
(2,'PB',1, 'Pab. 2 – Planta Baja – Aula 1'),
(2,'PB',2, 'Pab. 2 – Planta Baja – Aula 2'),
(2,'PB',3, 'Pab. 2 – Planta Baja – Aula 3'),
(2,'PB',4, 'Pab. 2 – Planta Baja – Aula 4'),
(2,'PB',5, 'Pab. 2 – Planta Baja – Aula 5'),
(2,'PB',6, 'Pab. 2 – Planta Baja – Aula 6'),
(2,'PB',7, 'Pab. 2 – Planta Baja – Aula 7'),
(2,'PB',8, 'Pab. 2 – Planta Baja – Aula 8'),
(2,'PB',9, 'Pab. 2 – Planta Baja – Aula 9'),
(2,'PB',10,'Pab. 2 – Planta Baja – Aula 10'),
-- Pabellón 2 – Piso 1
(2,'1',1, 'Pab. 2 – Piso 1 – Aula 1'),
(2,'1',2, 'Pab. 2 – Piso 1 – Aula 2'),
(2,'1',3, 'Pab. 2 – Piso 1 – Aula 3'),
(2,'1',4, 'Pab. 2 – Piso 1 – Aula 4'),
(2,'1',5, 'Pab. 2 – Piso 1 – Aula 5'),
(2,'1',6, 'Pab. 2 – Piso 1 – Aula 6'),
(2,'1',7, 'Pab. 2 – Piso 1 – Aula 7'),
(2,'1',8, 'Pab. 2 – Piso 1 – Aula 8'),
(2,'1',9, 'Pab. 2 – Piso 1 – Aula 9'),
(2,'1',10,'Pab. 2 – Piso 1 – Aula 10'),
-- Pabellón 2 – Piso 2
(2,'2',1, 'Pab. 2 – Piso 2 – Aula 1'),
(2,'2',2, 'Pab. 2 – Piso 2 – Aula 2'),
(2,'2',3, 'Pab. 2 – Piso 2 – Aula 3'),
(2,'2',4, 'Pab. 2 – Piso 2 – Aula 4'),
(2,'2',5, 'Pab. 2 – Piso 2 – Aula 5'),
(2,'2',6, 'Pab. 2 – Piso 2 – Aula 6'),
(2,'2',7, 'Pab. 2 – Piso 2 – Aula 7'),
(2,'2',8, 'Pab. 2 – Piso 2 – Aula 8'),
(2,'2',9, 'Pab. 2 – Piso 2 – Aula 9'),
(2,'2',10,'Pab. 2 – Piso 2 – Aula 10'),
-- Pabellón 2 – Piso 3
(2,'3',1, 'Pab. 2 – Piso 3 – Aula 1'),
(2,'3',2, 'Pab. 2 – Piso 3 – Aula 2'),
(2,'3',3, 'Pab. 2 – Piso 3 – Aula 3'),
(2,'3',4, 'Pab. 2 – Piso 3 – Aula 4'),
(2,'3',5, 'Pab. 2 – Piso 3 – Aula 5'),
(2,'3',6, 'Pab. 2 – Piso 3 – Aula 6'),
(2,'3',7, 'Pab. 2 – Piso 3 – Aula 7'),
(2,'3',8, 'Pab. 2 – Piso 3 – Aula 8'),
(2,'3',9, 'Pab. 2 – Piso 3 – Aula 9'),
(2,'3',10,'Pab. 2 – Piso 3 – Aula 10'),
-- Pabellón 2 – Piso 4
(2,'4',1, 'Pab. 2 – Piso 4 – Aula 1'),
(2,'4',2, 'Pab. 2 – Piso 4 – Aula 2'),
(2,'4',3, 'Pab. 2 – Piso 4 – Aula 3'),
(2,'4',4, 'Pab. 2 – Piso 4 – Aula 4'),
(2,'4',5, 'Pab. 2 – Piso 4 – Aula 5'),
(2,'4',6, 'Pab. 2 – Piso 4 – Aula 6'),
(2,'4',7, 'Pab. 2 – Piso 4 – Aula 7'),
(2,'4',8, 'Pab. 2 – Piso 4 – Aula 8'),
(2,'4',9, 'Pab. 2 – Piso 4 – Aula 9'),
(2,'4',10,'Pab. 2 – Piso 4 – Aula 10'),
-- Pabellón 2 – Piso 5
(2,'5',1, 'Pab. 2 – Piso 5 – Aula 1'),
(2,'5',2, 'Pab. 2 – Piso 5 – Aula 2'),
(2,'5',3, 'Pab. 2 – Piso 5 – Aula 3'),
(2,'5',4, 'Pab. 2 – Piso 5 – Aula 4'),
(2,'5',5, 'Pab. 2 – Piso 5 – Aula 5'),
(2,'5',6, 'Pab. 2 – Piso 5 – Aula 6'),
(2,'5',7, 'Pab. 2 – Piso 5 – Aula 7'),
(2,'5',8, 'Pab. 2 – Piso 5 – Aula 8'),
(2,'5',9, 'Pab. 2 – Piso 5 – Aula 9'),
(2,'5',10,'Pab. 2 – Piso 5 – Aula 10')
ON CONFLICT (pavilion, floor, number) DO NOTHING;

-- 4. VERIFICAR
DO $$
DECLARE
  total_classrooms INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_classrooms FROM classrooms;
  RAISE NOTICE '✅ Migración 017 completada';
  RAISE NOTICE '   Campos agregados a courses: classroom_pavilion, classroom_floor, classroom_number';
  RAISE NOTICE '   Total de aulas en catálogo: %', total_classrooms;
END $$;
