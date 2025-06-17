// marks.js - Working non-module version

// Global variables
let marks = [];
let currentTerm = 1;
const subjects = ['Math', 'English', 'Science', 'History', 'Geography'];

// Initialize marks entry
function initMarksEntry() {
  mockAuth.checkAuth().then(user => {
    if (!user?.isTeacher) {
      window.location.href = "TeacherLogin.html";
      return;
    }
    loadMarksData();
    setupTermSelector();
    renderMarksTable();
  });
}

async function loadMarksData() {
  try {
    const response = await fetch('marks.json');
    marks = await response.json();
  } catch (error) {
    console.error("Error loading marks:", error);
    marks = [];
  }
}

function setupTermSelector() {
  const termSelector = document.getElementById('term');
  if (termSelector) {
    termSelector.addEventListener('change', (e) => {
      currentTerm = parseInt(e.target.value);
      renderMarksTable();
    });
  }
}

async function renderMarksTable() {
  try {
    const studentsResponse = await fetch('students.json');
    const students = await studentsResponse.json();
    const container = document.querySelector('.marks-entry-container');
    
    if (!container) return;
    
    container.innerHTML = `
      <table class="marks-table">
        <thead>
          <tr>
            <th>Student</th>
            ${subjects.map(subject => `<th>${subject}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${students.map(student => {
            const studentMarks = marks.find(m => 
              m.StudentNo === student.StudentNo && m.Term === currentTerm
            ) || { Subjects: {} };
            
            return `
              <tr>
                <td>${student.Surname}, ${student.Forename}</td>
                ${subjects.map(subject => `
                  <td>
                    <input type="number" min="0" max="100" 
                      value="${studentMarks.Subjects[subject] || ''}"
                      onchange="marksModule.updateMark('${student.StudentNo}', '${subject}', this.value)">
                  </td>
                `).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <button onclick="marksModule.saveMarks()">Save All Marks</button>
    `;
  } catch (error) {
    console.error("Error rendering marks table:", error);
  }
}

function updateMark(studentNo, subject, value) {
  let termMarks = marks.find(m => 
    m.StudentNo === studentNo && m.Term === currentTerm
  );

  if (!termMarks) {
    termMarks = {
      StudentNo: studentNo,
      Term: currentTerm,
      Subjects: {}
    };
    marks.push(termMarks);
  }

  termMarks.Subjects[subject] = parseInt(value) || 0;
}

async function saveMarks() {
  try {
    localStorage.setItem('marksData', JSON.stringify(marks));
    alert('Marks saved successfully!');
  } catch (error) {
    console.error("Error saving marks:", error);
    alert('Failed to save marks');
  }
}

// Expose functions to global scope
window.marksModule = {
  initMarksEntry,
  updateMark,
  saveMarks,
  renderMarksTable
};