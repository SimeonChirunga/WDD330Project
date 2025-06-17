// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // Teacher login function
  export async function teacherLogin(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      // Add custom claim check if using admin privileges
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }
  
  // Parent login UI initialization
  export function initParentAuth() {
    const uiConfig = {
      signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
      signInSuccessUrl: '#',
      callbacks: {
        signInSuccessWithAuthResult: (authResult) => {
          document.getElementById('authStatus').classList.remove('hidden');
          document.getElementById('userEmail').textContent = authResult.user.email;
          document.getElementById('firebaseui-auth-container').classList.add('hidden');
          loadParentReports(authResult.user.uid);
          return false;
        }
      }
    };
    const ui = new firebaseui.auth.AuthUI(auth);
    ui.start('#firebaseui-auth-container', uiConfig);
  }
  
  // Check authentication state
  export async function checkAuth() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged((user) => {
        if (user) {
          // You might want to verify custom claims here for teacher/admin status
          resolve({ isTeacher: true, ...user });
        } else {
          resolve(null);
        }
      });
    });
  }
  
  // Logout function
  export function logout() {
    return auth.signOut().then(() => {
      window.location.href = "TeacherLogin.html";
    });
  }
  
  // Load parent reports
  async function loadParentReports(parentUID) {
    try {
      const response = await fetch('report_cards.json');
      const reports = await response.json();
      const studentResponse = await fetch('students.json');
      const students = await studentResponse.json();
      
      const linkedStudents = students.filter(s => s.ParentUID === parentUID);
      const studentReports = reports.filter(r => 
        linkedStudents.some(s => s.StudentNo === r.StudentNo)
      );
      
      displayReports(studentReports);
      document.getElementById('studentReports').classList.remove('hidden');
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  }
  
  function displayReports(reports) {
    const container = document.getElementById('reportCardsContainer');
    container.innerHTML = reports.map(report => `
      <div class="report-card">
        <h3>${report.StudentName} - Term ${report.Term}</h3>
        <div class="grades">
          ${Object.entries(report.Subjects).map(([subject, grade]) => `
            <p>${subject}: ${grade}</p>
          `).join('')}
        </div>
        <p class="comments">Comments: ${report.Comments || 'N/A'}</p>
      </div>
    `).join('');
  }