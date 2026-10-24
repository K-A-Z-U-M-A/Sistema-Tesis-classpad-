/**
 * Helper de Selectores Semánticos Estables para ClassPad.
 * Evita depender de clases CSS dinámicas de Material UI.
 */

export const SELECTORS = {
  auth: {
    emailInput: (page) => page.getByLabel(/correo electrónico|email|usuario/i),
    passwordInput: (page) => page.getByLabel(/contraseña|password/i),
    submitButton: (page) => page.getByRole('button', { name: /iniciar sesión|ingresar|login/i }),
    forgotPasswordLink: (page) => page.getByText(/¿olvidaste tu contraseña\?/i),
    logoutButton: (page) => page.getByRole('button', { name: /cerrar sesión|salir/i })
  },
  navigation: {
    sidebarItem: (page, name) => page.getByRole('link', { name: new RegExp(name, 'i') }),
    userMenu: (page) => page.getByRole('button', { name: /mi perfil|cuenta|usuario/i })
  },
  courses: {
    createCourseButton: (page) => page.getByRole('button', { name: /crear curso|nuevo curso/i }),
    courseNameInput: (page) => page.getByLabel(/nombre del curso/i),
    subjectInput: (page) => page.getByLabel(/materia|asignatura/i),
    enrollCodeInput: (page) => page.getByLabel(/código de inscripción|código/i),
    enrollButton: (page) => page.getByRole('button', { name: /inscribirme|unirse/i })
  },
  assignments: {
    createAssignmentButton: (page) => page.getByRole('button', { name: /nueva tarea|crear tarea/i }),
    titleInput: (page) => page.getByLabel(/título/i),
    descriptionInput: (page) => page.getByLabel(/descripción/i),
    submitAssignmentButton: (page) => page.getByRole('button', { name: /entregar tarea|enviar entrega/i }),
    fileInput: (page) => page.locator('input[type="file"]')
  },
  common: {
    saveButton: (page) => page.getByRole('button', { name: /guardar|publicar|crear/i }),
    cancelButton: (page) => page.getByRole('button', { name: /cancelar/i }),
    alertMessage: (page) => page.locator('.MuiAlert-root, [role="alert"]'),
    confirmDialog: (page) => page.getByRole('dialog')
  }
};
