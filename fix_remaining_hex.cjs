const fs = require('fs');
const path = require('path');

const files = [
  'web/src/pages/Courses/CourseDetail.jsx',
  'web/src/pages/Assignments/Assignments.jsx',
];

const map = [
  ["color: '#1976d2'", "color: 'primary.main'"],
  ['color: "#1976d2"', 'color: "primary.main"'],
  ["bgcolor: '#1976d2'", "bgcolor: 'primary.main'"],
  ['bgcolor: "#1976d2"', 'bgcolor: "primary.main"'],
  ["bgcolor: '#1565c0'", "bgcolor: 'primary.dark'"],
  ['bgcolor: "#1565c0"', 'bgcolor: "primary.dark"'],
  ["bgcolor: '#ff9800'", "bgcolor: 'warning.main'"],
  ['bgcolor: "#ff9800"', 'bgcolor: "warning.main"'],
  ["bgcolor: '#f57c00'", "bgcolor: 'warning.dark'"],
  ['bgcolor: "#f57c00"', 'bgcolor: "warning.dark"'],
  ["bgcolor: '#9c27b0'", "bgcolor: 'secondary.main'"],
  ['bgcolor: "#9c27b0"', 'bgcolor: "secondary.main"'],
  ["bgcolor: '#7b1fa2'", "bgcolor: 'secondary.dark'"],
  ['bgcolor: "#7b1fa2"', 'bgcolor: "secondary.dark"'],
];

for (const file of files) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    let count = 0;
    for (const [from, to] of map) {
      while (content.includes(from)) {
        content = content.replace(from, to);
        count++;
      }
    }
    if (count > 0) {
      fs.writeFileSync(p, content, 'utf8');
      console.log(`Replaced ${count} occurrences in ${file}`);
    }
  }
}
