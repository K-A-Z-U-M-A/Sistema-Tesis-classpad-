import ExcelJS from 'exceljs';

/**
 * Export grades to Excel format
 * @param {Array} grades - Array of grade objects with student information
 * @param {Object} courseInfo - Course information (name, code, etc.)
 * @returns {Buffer} Excel file buffer
 */
export async function exportGradesToExcel(grades, courseInfo) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Calificaciones');

    // Set worksheet properties
    worksheet.properties.defaultRowHeight = 20;

    // Add title
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Calificaciones - ${courseInfo.name}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
    };
    titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

    // Add course info
    worksheet.mergeCells('A2:L2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Código: ${courseInfo.course_code} | Turno: ${courseInfo.turn || 'N/A'}`;
    infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
    infoCell.font = { italic: true };

    // Add headers
    const headers = [
        'N°',
        'Cédula',
        'Nombre',
        'P1',
        'P2',
        'TP',
        'Total',
        'Hab. Final',
        'Hab. Recup',
        'Final',
        'Promedio',
        'Publicado'
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
    grades.forEach((grade, index) => {
        const row = worksheet.getRow(index + 5);

        row.getCell(1).value = index + 1;
        row.getCell(2).value = grade.cedula || 'N/A';
        row.getCell(3).value = grade.display_name;
        row.getCell(4).value = grade.parcial_1 || '';
        row.getCell(5).value = grade.parcial_2 || '';
        row.getCell(6).value = grade.trabajos_practicos || '';
        row.getCell(7).value = grade.total || '';
        row.getCell(8).value = grade.habilitado_final ? '✓' : '✗';
        row.getCell(9).value = grade.habilitado_recuperacion ? '✓' : '✗';
        row.getCell(10).value = grade.examen_final || '';
        row.getCell(11).value = grade.promedio || '';
        row.getCell(12).value = grade.is_published ? 'Sí' : 'No';

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
        { width: 5 },   // N°
        { width: 12 },  // Cédula
        { width: 25 },  // Nombre
        { width: 8 },   // P1
        { width: 8 },   // P2
        { width: 8 },   // TP
        { width: 10 },  // Total
        { width: 12 },  // Hab. Final
        { width: 12 },  // Hab. Recup
        { width: 8 },   // Final
        { width: 10 },  // Promedio
        { width: 10 }   // Publicado
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

/**
 * Import grades from Excel file
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Array} Array of grade objects
 */
export async function importGradesFromExcel(fileBuffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet('Calificaciones');
    if (!worksheet) {
        throw new Error('Hoja "Calificaciones" no encontrada en el archivo');
    }

    const grades = [];

    // Start from row 5 (after headers)
    for (let i = 5; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);

        // Skip empty rows
        if (!row.getCell(2).value && !row.getCell(3).value) {
            continue;
        }

        const grade = {
            cedula: row.getCell(2).value,
            display_name: row.getCell(3).value,
            parcial_1: parseFloat(row.getCell(4).value) || null,
            parcial_2: parseFloat(row.getCell(5).value) || null,
            trabajos_practicos: parseFloat(row.getCell(6).value) || null,
            examen_final: parseFloat(row.getCell(10).value) || null
        };

        grades.push(grade);
    }

    return grades;
}
