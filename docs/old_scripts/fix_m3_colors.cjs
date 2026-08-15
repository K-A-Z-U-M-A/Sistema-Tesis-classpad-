const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'web', 'src');

// All pages including auth and remaining
const pages = [
  'pages/People/People.jsx',
  'pages/Settings/Settings.jsx',
  'pages/Profile/Profile.jsx',
  'pages/Courses/CreateCourse.jsx',
  'pages/Courses/CourseDetail.jsx',
  'pages/Courses/Courses.jsx',
  'pages/Admin/AdminDashboard.jsx',
  'pages/Admin/Users.jsx',
  'pages/Admin/Audit.jsx',
  'pages/Admin/Reports.jsx',
  'pages/Manage/ArchivedCourses.jsx',
  'pages/Manage/CourseGradesManage.jsx',
  'pages/StudentProgress/StudentProgress.jsx',
  'pages/Messages/Messages.jsx',
  'pages/Assignments/Assignments.jsx',
  'pages/Assignments/AssignmentDetail.jsx',
  'pages/Assignments/EditAssignment.jsx',
  'pages/Attendance/Attendance.jsx',
  'pages/student/ProfileSettings.jsx',
  'pages/auth/Login.jsx',
  'pages/auth/Signup.jsx',
  'pages/auth/ForgotPassword.jsx',
  'pages/auth/ResetPassword.jsx',
  'pages/auth/VerifyResetCode.jsx',
  'components/Notifications/NotificationBell.jsx',
  'components/Notifications/NotificationBell.tsx',
  'components/ui/ConfirmDialog.jsx',
];

const replacements = [
  // ─── Hardcoded border radii (MUI spacing units) → remove to use theme ───
  ['borderRadius: 2,', 'borderRadius: "16px",'],
  ['borderRadius: 3,', 'borderRadius: "20px",'],
  ['borderRadius: 4,', 'borderRadius: "28px",'],
  ['borderRadius: 5,', 'borderRadius: "28px",'],
  ['borderRadius: 2 }', 'borderRadius: "16px" }'],
  ['borderRadius: 3 }', 'borderRadius: "20px" }'],
  ['borderRadius: 4 }', 'borderRadius: "28px" }'],
  ['borderRadius: 5 }', 'borderRadius: "28px" }'],

  // ─── Primary (#0A7AFF → M3 primary) ──────────────────────────────────────
  ["'#0A7AFF'", "'#6750A4'"],
  ['"#0A7AFF"', '"#6750A4"'],
  ["'#0067D8'", "'#7965AF'"],
  ['"#0067D8"', '"#7965AF"'],
  ["'#4DA3FF'", "'#9A82DB'"],
  ['"#4DA3FF"', '"#9A82DB"'],
  ["'#003B75'", "'#21005D'"],
  ['"#003B75"', '"#21005D"'],
  ["'#E8F1FF'", "'#EADDFF'"],
  ['"#E8F1FF"', '"#EADDFF"'],

  // ─── Surface colors ───────────────────────────────────────────────────────
  ["'#F5F6FA'", "'#FFFBFE'"],
  ['"#F5F6FA"', '"#FFFBFE"'],
  ["'#F0F2F7'", "'#E7E0EC'"],
  ['"#F0F2F7"', '"#E7E0EC"'],
  ["'#F7F8FB'", "'#F3EDF7'"],
  ['"#F7F8FB"', '"#F3EDF7"'],
  ["'#ECEEF4'", "'#ECE6F0'"],
  ['"#ECEEF4"', '"#ECE6F0"'],

  // ─── Outline colors ───────────────────────────────────────────────────────
  ["'#D9DCE3'", "'#CAC4D0'"],
  ['"#D9DCE3"', '"#CAC4D0"'],
  ["'#E7E9EF'", "'#CAC4D0'"],
  ['"#E7E9EF"', '"#CAC4D0"'],

  // ─── On surface / text ────────────────────────────────────────────────────
  ["'#1C1B1F'", "'#1C1B1F'"],  // keep — already correct M3 token
  ["'#67666B'", "'#49454F'"],
  ['"#67666B"', '"#49454F"'],
  ["'#98979D'", "'#79747E'"],
  ['"#98979D"', '"#79747E"'],

  // ─── Success (#24A148 → M3 success) ─────────────────────────────────────
  ["'#24A148'", "'#146C2E'"],
  ['"#24A148"', '"#146C2E"'],
  ["'#E5F6EA'", "'#C6EFD1'"],
  ['"#E5F6EA"', '"#C6EFD1"'],
  ["'#0D4D25'", "'#002110'"],
  ['"#0D4D25"', '"#002110"'],

  // ─── Warning (#E78000 → M3 warning) ─────────────────────────────────────
  ["'#E78000'", "'#7E5700'"],
  ['"#E78000"', '"#7E5700"'],
  ["'#FFF2DC'", "'#FFDDB0'"],
  ['"#FFF2DC"', '"#FFDDB0"'],
  ["'#6B3C00'", "'#2B1700'"],
  ['"#6B3C00"', '"#2B1700"'],

  // ─── Error (#D93025 → M3 error) ──────────────────────────────────────────
  ["'#D93025'", "'#B3261E'"],
  ['"#D93025"', '"#B3261E"'],
  ["'#FDE9E7'", "'#F9DEDC'"],
  ['"#FDE9E7"', '"#F9DEDC"'],
  ["'#7D1C15'", "'#410E0B'"],
  ['"#7D1C15"', '"#410E0B"'],
];

let totalFiles = 0;
let totalChanges = 0;

for (const page of pages) {
  const fullPath = path.join(srcDir, page);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${page}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  for (const [from, to] of replacements) {
    if (from === to) continue;
    while (content.includes(from)) {
      content = content.replace(from, to);
      changes++;
    }
  }

  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  Updated (${changes} replacements): ${page}`);
    totalFiles++;
    totalChanges += changes;
  } else {
    console.log(`  No changes: ${page}`);
  }
}

console.log(`\nDone! ${totalChanges} replacements across ${totalFiles} files.`);
