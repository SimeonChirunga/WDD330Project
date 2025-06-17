import { checkAuth } from './auth.js';

let reports = [];
let students = [];
let marks = [];

// Initialize reports
export async function initReports() {
  const user = await checkAuth();
  if (!user?.isTeacher) {
    window.location.href = "TeacherLogin.html";
    return;
  }

  await loadAllData();
  setupReportControls();
}

// Load all required data
async function loadAllData() {
  try {
    const [studentsRes, marksRes, reportsRes] = await Promise.all([
      fetch('students.json'),
      fetch('marks.json'),
      fetch('report_cards.json')
    ]);
    
    students = await studentsRes.json();
    marks = await marksRes.json();
    reports = await reportsRes.json();
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Failed to load required data");
  }
}

// Setup report controls
function setupReportControls() {
  document.getElementById('reportTerm').addEventListener('change', renderReportPreview);
  document.getElementById('generateReports').addEventListener('click', generateReports);
  
  // Populate class filter
  const classFilter = document.getElementById('filterClass');
  const classes = [...new Set(students.map(s => s.Class))];
  classFilter.innerHTML = `
    <option value="all">All Classes</option>
    ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
  `;
}

// Generate reports
export async function generateReports() {
  const term = parseInt(document.getElementById('reportTerm').value);
  const newReports = [];
  
  // Process each student
  for (const student of students) {
    const studentMarks = marks.filter(m => 
      m.StudentNo === student.StudentNo && m.Term === term
    );
    
    if (studentMarks.length === 0) continue;
    
    // Calculate averages and comments
    const report = {
      StudentNo: student.StudentNo,
      StudentName: `${student.Surname}, ${student.Forename}`,
      Class: student.Class,
      Term: term,
      DateGenerated: new Date().toISOString(),
      Subjects: {},
      Comments: generateComments(studentMarks)
    };
    
    // Process subjects
    studentMarks.forEach(termMark => {
      Object.entries(termMark.Subjects).forEach(([subject, grade]) => {
        report.Subjects[subject] = grade;
      });
    });
    
    newReports.push(report);
  }
  
  // Save reports
  reports = [...reports.filter(r => r.Term !== term), ...newReports];
  await saveReports();
  renderReportPreview();
}

// Generate comments
function generateComments(studentMarks) {
  const subjectsCount = Object.keys(studentMarks[0]?.Subjects || {}).length;
  if (subjectsCount === 0) return "No marks available";
  
  const average = Object.values(studentMarks[0].Subjects)
    .reduce((sum, grade) => sum + grade, 0) / subjectsCount;
  
  if (average >= 85) return "Excellent performance across all subjects";
  if (average >= 70) return "Good performance with room for improvement";
  if (average >= 50) return "Satisfactory performance, needs more effort";
  return "Needs significant improvement and additional support";
}

// Render report preview
function renderReportPreview() {
  const term = parseInt(document.getElementById('reportTerm').value);
  const termReports = reports.filter(r => r.Term === term);
  
  const preview = document.getElementById('reportPreview');
  preview.innerHTML = termReports.map(report => `
    <div class="report-preview">
      <h3>${report.StudentName} - ${report.Class}</h3>
      <table>
        ${Object.entries(report.Subjects).map(([subject, grade]) => `
          <tr>
            <td>${subject}</td>
            <td>${grade}</td>
            <td>${getGradeRemark(grade)}</td>
          </tr>
        `).join('')}
      </table>
      <p><strong>Comments:</strong> ${report.Comments}</p>
    </div>
  `).join('') || '<p>No reports generated for this term yet</p>';
  
  preview.classList.remove('hidden');
}

// Get grade remark
function getGradeRemark(grade) {
  if (grade >= 90) return "A+ (Outstanding)";
  if (grade >= 80) return "A (Excellent)";
  if (grade >= 70) return "B (Good)";
  if (grade >= 60) return "C (Satisfactory)";
  if (grade >= 50) return "D (Needs Improvement)";
  return "E (Unsatisfactory)";
}

// Save reports
async function saveReports() {
  try {
    localStorage.setItem('reportData', JSON.stringify(reports));
    await fetch('updateReports.php', {
      method: 'POST',
      body: JSON.stringify(reports)
    });
    alert('Reports saved successfully!');
  } catch (error) {
    console.error("Error saving reports:", error);
    alert('Failed to save reports');
  }
}

// Filter reports (for reports-view.html)
export function filterReports() {
  const term = document.getElementById('filterTerm').value;
  const classFilter = document.getElementById('filterClass').value;
  
  let filtered = [...reports];
  
  if (term !== 'all') {
    filtered = filtered.filter(r => r.Term === parseInt(term));
  }
  
  if (classFilter !== 'all') {
    filtered = filtered.filter(r => r.Class === classFilter);
  }
  
  renderReports(filtered);
}

// Render reports
function renderReports(reportsToShow) {
  const container = document.getElementById('reportsContainer');
  container.innerHTML = reportsToShow.map(report => `
    <div class="report-card">
      <h3>${report.StudentName} - Term ${report.Term}</h3>
      <p>Class: ${report.Class}</p>
      <div class="grades">
        ${Object.entries(report.Subjects).map(([subject, grade]) => `
          <p>${subject}: ${grade} (${getGradeRemark(grade)})</p>
        `).join('')}
      </div>
      <p class="date">Generated: ${new Date(report.DateGenerated).toLocaleDateString()}</p>
    </div>
  `).join('') || '<p>No reports match your filters</p>';
}

// Make functions available globally
window.generateReports = generateReports;
window.filterReports = filterReports;