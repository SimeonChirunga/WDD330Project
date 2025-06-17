// auth.js - Non-module version for direct browser use

// Mock authentication system for testing
const auth = {
    currentUser: null,
    
    teacherLogin: function() {
      this.currentUser = {
        uid: 'test-teacher-uid',
        email: 'testteacher@school.edu',
        displayName: 'Test Teacher',
        isTeacher: true
      };
      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return Promise.resolve(this.currentUser);
    },
    
    parentLogin: function() {
      this.currentUser = {
        uid: 'test-parent-uid',
        email: 'testparent@example.com',
        displayName: 'Test Parent',
        isTeacher: false
      };
      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return Promise.resolve(this.currentUser);
    },
    
    checkAuth: function() {
      const user = JSON.parse(sessionStorage.getItem('currentUser'));
      this.currentUser = user || null;
      return Promise.resolve(this.currentUser);
    },
    
    logout: function() {
      this.currentUser = null;
      sessionStorage.removeItem('currentUser');
      return Promise.resolve();
    },
    
    // For parent portal
    initParentAuth: function() {
      // Auto-login as test parent
      this.parentLogin().then(() => {
        document.getElementById('authStatus').classList.remove('hidden');
        document.getElementById('userEmail').textContent = this.currentUser.email;
        if (document.getElementById('firebaseui-auth-container')) {
          document.getElementById('firebaseui-auth-container').classList.add('hidden');
        }
        if (typeof loadParentReports === 'function') {
          loadParentReports(this.currentUser.uid);
        }
      });
    }
  };
  
  // Make available globally
  window.mockAuth = auth;