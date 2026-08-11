/**
 * test-data.fixture.js
 * Fixture con datos de prueba estáticos usados en los tests E2E.
 * NO crea ni modifica datos en la base de datos; referencia datos sembrados
 * previamente por el script `reset-and-seed-students.js`.
 */

import { test as base } from '@playwright/test';

/** Datos de alumnos sembrados (coinciden con students_data.json) */
export const SEEDED_STUDENTS = [
  { name: 'Juan Pérez',       email: 'juan.perez@test.com'       },
  { name: 'María González',   email: 'maria.gonzalez@test.com'   },
  { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@test.com' },
  { name: 'Ana Martínez',     email: 'ana.martinez@test.com'     },
  { name: 'Luis Fernández',   email: 'luis.fernandez@test.com'   },
  { name: 'Laura Sánchez',    email: 'laura.sanchez@test.com'    },
  { name: 'Diego López',      email: 'diego.lopez@test.com'      },
  { name: 'Valentina Torres', email: 'valentina.torres@test.com' },
  { name: 'Mateo García',     email: 'mateo.garcia@test.com'     },
  { name: 'Sofía Ramírez',    email: 'sofia.ramirez@test.com'    },
];

/** Datos de formularios inválidos para pruebas de validación */
export const INVALID_INPUTS = {
  email:    ['noesuncorreo', 'sindominio@', '@sincuenta.com', ''],
  password: ['', '123', 'sinmayuscula1!'],
  empty:    '',
};

/** Mensajes de texto corto para prueba de mensajería */
export const TEST_MESSAGES = {
  short:   'Mensaje de prueba E2E ClassPad.',
  medium:  'Este es un mensaje de prueba generado automáticamente por el suite E2E de ClassPad para verificar el correcto funcionamiento del módulo de mensajería entre usuarios.',
};

/**
 * Fixture extendido que expone el catálogo de datos de prueba.
 */
export const test = base.extend({
  testData: async ({}, use) => {
    await use({
      students:      SEEDED_STUDENTS,
      invalidInputs: INVALID_INPUTS,
      messages:      TEST_MESSAGES,
    });
  },
});

export { base };
