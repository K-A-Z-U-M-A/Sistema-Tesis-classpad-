import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Helper function to check if user is teacher of course
async function isCourseTeacher(userId, courseId) {
    const result = await pool.query(
        `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     WHERE c.id = $1 AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
        [courseId, userId]
    );
    return result.rows.length > 0;
}

// GET /api/reports/course/:courseId/excel - Export grades to Excel
router.get('/course/:courseId/excel', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden exportar reportes',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        console.log('📊 Generando reporte Excel para curso:', courseId);

        // Get course info
        const courseResult = await pool.query(
            'SELECT name, course_code, turn, grade, semester, year FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Curso no encontrado',
                    code: 'COURSE_NOT_FOUND'
                }
            });
        }

        const course = courseResult.rows[0];

        // Get all students with grades
        const gradesResult = await pool.query(
            `SELECT 
        u.cedula,
        u.display_name as nombre,
        sg.parcial_1,
        sg.parcial_2,
        sg.recuperatoria,
        sg.trabajos_practicos,
        sg.examen_final,
        sg.promedio,
        COALESCE(sg.parcial_1, 0) + COALESCE(sg.parcial_2, 0) + COALESCE(sg.trabajos_practicos, 0) as total,
        CASE WHEN (COALESCE(sg.parcial_1, 0) + COALESCE(sg.parcial_2, 0) + COALESCE(sg.trabajos_practicos, 0)) >= 36 THEN true ELSE false END as habilita_final,
        CASE WHEN (COALESCE(sg.parcial_1, 0) + COALESCE(sg.parcial_2, 0) + COALESCE(sg.trabajos_practicos, 0)) >= 24 AND (COALESCE(sg.parcial_1, 0) + COALESCE(sg.parcial_2, 0) + COALESCE(sg.trabajos_practicos, 0)) < 36 THEN true ELSE false END as habilita_recup
      FROM users u
      INNER JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN student_grades sg ON u.id = sg.student_id AND sg.course_id = $1
      WHERE e.course_id = $1 AND e.status = 'active'
      ORDER BY u.display_name`,
            [courseId]
        );

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Calificaciones');

        // Set worksheet properties
        worksheet.properties.defaultRowHeight = 20;

        // Add title
        worksheet.mergeCells('A1:L1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Calificaciones - ${course.name}`;
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1976D2' }
        };

        // Add course info
        worksheet.mergeCells('A2:L2');
        const infoCell = worksheet.getCell('A2');
        infoCell.value = `Código: ${course.course_code} | Turno: ${course.turn || 'N/A'} | ${course.grade || ''} ${course.semester || ''}`;
        infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
        infoCell.font = { italic: true };

        // Add headers
        const headers = [
            'Cédula',
            'Nombre',
            'P1',
            'P2',
            'Recup',
            'TP',
            'Total',
            'Hab. Final',
            'Hab. Recup',
            'Final',
            'Promedio'
        ];

        const headerRow = worksheet.getRow(4);
        headers.forEach((header, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF424242' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add data rows
        gradesResult.rows.forEach((grade, index) => {
            const row = worksheet.getRow(index + 5);

            row.getCell(1).value = grade.cedula || 'N/A';
            row.getCell(2).value = grade.nombre;
            row.getCell(3).value = grade.parcial_1 || '';
            row.getCell(4).value = grade.parcial_2 || '';
            row.getCell(5).value = grade.recuperatoria || '';
            row.getCell(6).value = grade.trabajos_practicos || '';
            row.getCell(7).value = grade.total || '';
            row.getCell(8).value = grade.habilita_final ? '✓' : '✗';
            row.getCell(9).value = grade.habilita_recup ? '✓' : '✗';
            row.getCell(10).value = grade.examen_final || '';
            row.getCell(11).value = grade.promedio || '';

            // Style data cells
            row.eachCell((cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // Highlight habilitaciones
                if (colNumber === 8 || colNumber === 9) {
                    cell.font = { bold: true };
                    if (cell.value === '✓') {
                        cell.font = { ...cell.font, color: { argb: 'FF4CAF50' } };
                    } else {
                        cell.font = { ...cell.font, color: { argb: 'FFF44336' } };
                    }
                }

                // Highlight promedio
                if (colNumber === 11 && cell.value) {
                    const promedio = parseFloat(cell.value);
                    if (promedio >= 6) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFC8E6C9' }
                        };
                    } else if (promedio >= 4) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFF9C4' }
                        };
                    } else {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFCDD2' }
                        };
                    }
                }
            });
        });

        // Set column widths
        worksheet.columns = [
            { width: 12 },  // Cédula
            { width: 30 },  // Nombre
            { width: 8 },   // P1
            { width: 8 },   // P2
            { width: 8 },   // Recup
            { width: 8 },   // TP
            { width: 10 },  // Total
            { width: 12 },  // Hab. Final
            { width: 12 },  // Hab. Recup
            { width: 8 },   // Final
            { width: 10 }   // Promedio
        ];

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        console.log('✅ Reporte Excel generado exitosamente');

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Calificaciones_${course.name.replace(/\s+/g, '_')}_${course.course_code}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        console.error('❌ Error generando reporte Excel:', error);
        res.status(500).json({
            error: {
                message: 'Error generando reporte Excel',
                code: 'GENERATE_EXCEL_FAILED',
                details: error.message
            }
        });
    }
});

// GET /api/reports/course/:courseId/pdf - Export grades to PDF
router.get('/course/:courseId/pdf', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden exportar reportes',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        console.log('📄 Generando reporte PDF para curso:', courseId);

        // Get course info
        const courseResult = await pool.query(
            'SELECT name, course_code, turn, grade, semester, year FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Curso no encontrado',
                    code: 'COURSE_NOT_FOUND'
                }
            });
        }

        const course = courseResult.rows[0];

        // Get all students with grades
        const gradesResult = await pool.query(
            `SELECT 
        u.cedula,
        u.display_name as nombre,
        sg.parcial_1,
        sg.parcial_2,
        sg.recuperatoria,
        sg.trabajos_practicos,
        sg.examen_final,
        sg.promedio,
        COALESCE(sg.parcial_1, 0) + COALESCE(sg.parcial_2, 0) + COALESCE(sg.trabajos_practicos, 0) as total
      FROM users u
      INNER JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN student_grades sg ON u.id = sg.student_id AND sg.course_id = $1
      WHERE e.course_id = $1 AND e.status = 'active'
      ORDER BY u.display_name`,
            [courseId]
        );

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Calificaciones_${course.name.replace(/\s+/g, '_')}_${course.course_code}.pdf"`);
            res.send(pdfBuffer);
            console.log('✅ Reporte PDF generado exitosamente');
        });

        // Add title
        doc.fontSize(20).text(`Calificaciones - ${course.name}`, { align: 'center' });
        doc.fontSize(12).text(`Código: ${course.course_code} | Turno: ${course.turn || 'N/A'}`, { align: 'center' });
        doc.moveDown();

        // Add table headers
        const tableTop = 150;
        const rowHeight = 20;
        doc.fontSize(10);

        // Headers
        doc.text('Cédula', 50, tableTop);
        doc.text('Nombre', 120, tableTop);
        doc.text('P1', 250, tableTop);
        doc.text('P2', 280, tableTop);
        doc.text('Recup', 310, tableTop);
        doc.text('TP', 350, tableTop);
        doc.text('Total', 380, tableTop);
        doc.text('Final', 420, tableTop);
        doc.text('Prom', 460, tableTop);

        // Draw line under headers
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Add data rows
        let y = tableTop + 25;
        gradesResult.rows.forEach((grade, index) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.text(grade.cedula || 'N/A', 50, y);
            doc.text(grade.nombre.substring(0, 20), 120, y);
            doc.text(grade.parcial_1 || '-', 250, y);
            doc.text(grade.parcial_2 || '-', 280, y);
            doc.text(grade.recuperatoria || '-', 310, y);
            doc.text(grade.trabajos_practicos || '-', 350, y);
            doc.text(grade.total || '-', 380, y);
            doc.text(grade.examen_final || '-', 420, y);
            doc.text(grade.promedio || '-', 460, y);

            y += rowHeight;
        });

        doc.end();
    } catch (error) {
        console.error('❌ Error generando reporte PDF:', error);
        res.status(500).json({
            error: {
                message: 'Error generando reporte PDF',
                code: 'GENERATE_PDF_FAILED',
                details: error.message
            }
        });
    }
});

export default router;
