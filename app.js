/* ---------- DOM & STATE ---------- */
const DOM = {
  // Loaders & Containers
  globalLoader: document.getElementById('global-loader'),
  authContainer: document.getElementById('auth-container'),
  appContainer: document.getElementById('app-container'),
  
  // App Shell
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  pageTitle: document.getElementById('page-title'),
  appContent: document.querySelector('.app-content'),
  mainNavList: document.querySelector('.nav-list'),
  backBtn: document.getElementById('back-btn'),
  hamburgerBtn: document.getElementById('hamburger-btn'),
  settingsBtn: document.getElementById('settings-btn'), // Added
  
  // Pages
  allPages: document.querySelectorAll('.page-content'),
  pageAdmin: document.getElementById('page-admin'),
  pageFeed: document.getElementById('page-feed'),
  pageDirectory: document.getElementById('page-directory'),
  pageEvents: document.getElementById('page-events'),
  pageCareers: document.getElementById('page-careers'),
  pageMentorship: document.getElementById('page-mentorship'),
  pageMessages: document.getElementById('page-messages'),
  pageProfile: document.getElementById('page-profile'),
  pageChat: document.getElementById('page-chat'),
  
  // Modal
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modal-body'),
  modalCloseBtn: document.getElementById('modal-close-btn'), // Added
};

/* ======================================================
   LOCAL DATABASE (100% NO FIREBASE)
========================================================= */

let LOCAL_DB = {}; // Will be populated by STORAGE.getDB()

const STORAGE = {
  getDB: () => {
    const db = localStorage.getItem('alumniAppDB');
    if (db) {
      LOCAL_DB = JSON.parse(db);
    } else {
      // If no DB, create a default one
      LOCAL_DB = {
        // 'users' = SOCIAL PROFILES. Everyone who logs in. (Handles 1000+ logins)
        users: [
          { uid: 'u_admin', name: 'Admin User', email: 'admin', pass: 'admin', role: 'admin', company: 'Alumni Platform', jobTitle: 'Site Administrator', bio: 'I manage this platform.', location: 'Main Campus', phone: '111-222-3333' },
          { uid: 'u_user', name: 'Demo Alumni', email: 'user', pass: 'user', role: 'user', company: 'Google', jobTitle: 'Software Engineer', bio: 'Excited to be part of this community!', location: 'New York, NY', phone: '444-555-6666' }
        ],
        // 'alumni' = OFFICIAL SCHOOL RECORDS. Managed ONLY by admin. (Handles 1000+ records)
        alumni: [
          { id: 'al_1', name: 'John Doe', email: 'john@example.com', phone: '1234567890', degree: 'B.Tech CSE', year: 2018, company: 'Google', location: 'Mountain View, USA'},
          { id: 'al_2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', degree: 'M.Tech AI', year: 2020, company: 'Microsoft', location: 'Redmond, USA'},
          { id: 'al_3', name: 'Robert Brown', email: 'rob@example.com', phone: '555123456', degree: 'B.Com', year: 2019, company: 'Deloitte', location: 'New York, USA'},
        ],
        // Engagement Data
        events: [
          {id: 'ev_1', title: 'Annual Alumni Meet 2025', date: '2025-12-20', location: 'University Auditorium', desc: 'The grand annual alumni reunion.'}
        ],
        careers: [
          {id: 'car_1', title: 'Software Engineer II', company: 'Google', location: 'Remote', applyLink: '#', desc: 'Looking for a skilled engineer...', postedOn: Date.now()}
        ],
        mentors: [
           {id: 'm_1', uid: 'u_user', name: 'Demo Alumni (user)', domain: 'Software Engineering, Cloud', bio: 'Happy to help with career advice!'}
        ],
        posts: [], // Social feed posts
        messages: [] // NEW: For the chat system
      };
      
      // *** FIX: REMOVED DUMMY ALUMNI GENERATION ***
      /*
      // Generate 1000+ dummy alumni records
      for (let i = 4; i <= 1000; i++) {
        LOCAL_DB.alumni.push({
          id: `al_${i}`, name: `Alumni Student ${i}`, email: `student${i}@school.edu`, phone: '555-5555', degree: 'B.Sc Physics', year: 2017, company: 'Tech Corp', location: 'Boston, USA'
        });
      }
      */
      
      STORAGE.saveDB();
    }
  },
  saveDB: () => {
    localStorage.setItem('alumniAppDB', JSON.stringify(LOCAL_DB));
  },
  savePfpLocal: (uid, base64String) => {
    try {
      localStorage.setItem(`pfp_${uid}`, base64String);
    } catch (e) {
      alert("Could not save profile picture. Browser storage might be full.");
    }
  },
  getPfpLocal: (uid) => {
    return localStorage.getItem(`pfp_${uid}`);
  }
};

// Global state
let currentUserProfile = null;
let pageStack = []; // FOR THE BACK BUTTON

const PREFS = {
  getTheme: () => localStorage.getItem('theme'),
  saveTheme: theme => localStorage.setItem('theme', theme),
  getNotifPref: () => localStorage.getItem('emailNotifs') === 'true',
  saveNotifPref: pref => localStorage.setItem('emailNotifs', pref),
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/* ---------- MODAL & LOADING ---------- */
function openModal(renderFn) {
  DOM.modal.classList.remove('hidden');
  DOM.modalBody.innerHTML = '';
  renderFn(DOM.modalBody);
}

function closeModal() {
  DOM.modal.classList.add('hidden');
  DOM.modalBody.innerHTML = '';
}

function setPageLoading(pageElement) {
  pageElement.innerHTML = `<div class="loader-spinner" style="margin: 4rem auto;"></div>`;
}

/* ---------- NEW: NAVIGATION (Sidebar, Back Button, History) ---------- */
function toggleSidebar(forceOpen = null) {
    if (forceOpen === true) {
        DOM.sidebar.classList.add('active');
        DOM.sidebarOverlay.classList.add('active');
    } else if (forceOpen === false) {
        DOM.sidebar.classList.remove('active');
        DOM.sidebarOverlay.classList.remove('active');
    } else {
        DOM.sidebar.classList.toggle('active');
        DOM.sidebarOverlay.classList.toggle('active');
    }
}

function updateNavButtons(pageId) {
  DOM.mainNavList.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
}

function updateTopBar(title, isSubPage = false) {
  DOM.pageTitle.textContent = title;
  DOM.backBtn.classList.toggle('hidden', !isSubPage);
  DOM.hamburgerBtn.classList.toggle('hidden', isSubPage);
}

// This is the NEW navigation controller
function navigateTo(pageId, pageTitle, context = {}) {
  const currentPage = document.querySelector('.page-content.active');
  if (!currentPage) return; 
  
  // Don't push to stack if it's the same page
  if (pageStack.length > 0 && pageStack[pageStack.length - 1].id === currentPage.id) {
    // This is a special case for re-rendering the chat page
    if (pageId !== 'page-chat') {
        pageStack.pop(); 
    }
  }

  pageStack.push({
    id: currentPage.id,
    title: DOM.pageTitle.textContent,
    // We must save the *context* of the page, not the raw HTML
    // because the page content is dynamic and needs to be re-rendered
    pageFunction: () => _renderPage(currentPage.id, DOM.pageTitle.textContent, {}, false),
  });

  // *** MESSAGING BUG FIX ***
  // Always call _renderPage. The switch statement inside it will
  // correctly call the render function for page-chat.
  _renderPage(pageId, pageTitle, context, true);
  
  // *** TRACKPAD FIX ***
  // Push a state to the browser's history to match our app's navigation
  history.pushState({ pageId, pageTitle, context }, pageTitle, `#${pageId}`);
 
  if (DOM.sidebar.classList.contains('active')) {
      toggleSidebar(false); // Close sidebar on nav
  }
}

function goBack() {
  // *** TRACKPAD FIX ***
  // Instead of handling logic here, just tell the browser
  // to go back. The 'popstate' listener will handle the rest.
  history.back();
}

/**
 * *** NEW: TRACKPAD FIX ***
 * This function handles all "back" navigation,
 * whether from the in-app button or browser swipe.
 */
function handlePopState(e) {
  const lastPage = pageStack.pop();
  if (!lastPage) {
    // We're at the beginning. Re-render default page to prevent user from leaving.
    applyRolePermissions();
    return;
  }
  
  // We popped a page, so we are "going back" to it.
  // We just re-run its render function.
  lastPage.pageFunction();
  // And update the top bar
  updateTopBar(lastPage.title, pageStack.length > 0);
}


// This is the internal rendering engine
function _renderPage(pageId, pageTitle, context = {}, isNewPage = false) {
  DOM.allPages.forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  // Update top bar ONLY IF it's a base page (not a sub-page click like 'goBack')
  if (isNewPage) {
     updateNavButtons(pageId);
     updateTopBar(pageTitle, pageStack.length > 0); 
  }
  
  // Render page content from scratch
  switch(pageId) {
    case 'page-admin':
      renderAdminDatabasePage();
      break;
    case 'page-feed':
      renderHomePage();
      break;
    case 'page-directory':
      renderDirectoryPage();
      break;
    case 'page-events':
      renderEventsPage();
      break;
    case 'page-careers':
      renderCareersPage();
      break;
    case 'page-mentorship':
       renderMentorshipPage();
      break;
    case 'page-messages':
      renderMessagesPage();
      break;
    case 'page-profile':
      // If context.uid is provided (e.g., from directory), use it.
      // Otherwise (e.g., from sidebar), use the current user's UID.
      renderProfilePage(context.uid || currentUserProfile.uid);
      break;
    case 'page-chat':
      // This is now handled by its own render function
      _renderChatPage(context.user);
      break;
  }
}


/* ---------- AUTHENTICATION (LOCAL) ---------- */
function renderAuthPage() {
  DOM.authContainer.innerHTML = `
    <div class="auth-box">
      <h2>Alumni Platform</h2>
      <p>Login with <strong>admin</strong>/<strong>admin</strong> (for Faculty) or <strong>user</strong>/<strong>user</strong> (for Alumni).</p>
      <div class='form-row'><input id='auth_email' type='text' placeholder='Email (or "admin")' value="admin"/></div>
      <div class='form-row'><input id='auth_pass' type='password' placeholder='Password' value="admin"/></div>
      <div class='form-actions'>
        <button id='loginBtn' class='btn'>Login</button>
      </div>
      <div class="auth-toggle">
        Don't have an account? <span onclick="renderRegisterPage()">Sign Up</span>
      </div>
    </div>
  `;
  DOM.authContainer.querySelector('#loginBtn').addEventListener('click', handleLogin);
}

function renderRegisterPage() {
  DOM.authContainer.innerHTML = `
    <div class="auth-box">
      <h2>Create Account</h2>
      <p>Create a user profile to join the social directory.</p>
      <div class='form-row'><input id='reg_name' type='text' placeholder='Full Name' /></div>
      <div class='form-row'><input id='reg_email' type='email' placeholder='Email' /></div>
      <div class='form-row'><input id='reg_pass' type='password' placeholder='Password' /></div>
      <div class='form-row'>
        <select id='reg_role'>
          <option value="user">I am an Alumni</option>
          <option value="admin">I am Faculty/Admin</option>
        </select>
      </div>
      <div class='form-actions'>
        <button id='registerBtn' class='btn'>Sign Up</button>
      </div>
      <div class="auth-toggle">
        Already have an account? <span onclick="renderAuthPage()">Login</span>
      </div>
    </div>
  `;
  DOM.authContainer.querySelector('#registerBtn').addEventListener('click', handleRegister);
}

function handleLogin() {
  const email = DOM.authContainer.querySelector('#auth_email').value;
  const pass = DOM.authContainer.querySelector('#auth_pass').value;
  if (!email || !pass) return alert('Please enter email and password.');

  const user = LOCAL_DB.users.find(u => u.email === email && u.pass === pass);

  if (user) {
    sessionStorage.setItem('alumniUserUID', user.uid);
    showApp(user);
  } else {
    alert("Invalid credentials. Try admin/admin or user/user.");
  }
}

function handleRegister() {
  const name = DOM.authContainer.querySelector('#reg_name').value;
  const email = DOM.authContainer.querySelector('#reg_email').value;
  const pass = DOM.authContainer.querySelector('#reg_pass').value;
  const role = DOM.authContainer.querySelector('#reg_role').value;
  if (!name || !email || !pass) return alert('Please fill all fields.');

  if (LOCAL_DB.users.find(u => u.email === email)) {
    return alert('An account with this email already exists.');
  }
  
  const newUser = {
    uid: 'u_' + Date.now(),
    name: name, email: email, pass: pass, role: role,
    company: '', jobTitle: '', bio: `A proud member of the alumni community.`, location: '', phone: ''
  };
  
  LOCAL_DB.users.push(newUser);
  STORAGE.saveDB();
  
  alert('Account created! Logging you in.');
  sessionStorage.setItem('alumniUserUID', newUser.uid);
  showApp(newUser);
}

function logout() {
  sessionStorage.removeItem('alumniUserUID');
  currentUserProfile = null;
  pageStack = []; 
  closeModal();
  
  DOM.appContainer.classList.add('hidden');
  DOM.authContainer.classList.remove('hidden');
  renderAuthPage();
  
  // Clear browser history for the app
  history.replaceState(null, '', 'index.html');
}

/* ======================================================
   ADMIN-ONLY DATABASE PAGE (YOUR ORIGINAL REQUIREMENT)
========================================================= */

function renderAdminDatabasePage() {
  setPageLoading(DOM.pageAdmin);
  
  DOM.pageAdmin.innerHTML = `
    <div class="toolbar directory-toolbar">
      <input type="text" id="admin-alumni-search" placeholder="Search ${LOCAL_DB.alumni.length} official alumni records..." />
      <button id="add-alumni-btn" class="btn small">Add New Record</button>
    </div>
    <div id="admin-alumni-list-container"></div>
  `;
  
  document.getElementById('admin-alumni-search').addEventListener('input', (e) => {
    displayAdminAlumniList(e.target.value);
  });
  document.getElementById('add-alumni-btn').addEventListener('click', () => {
    openModal(c => renderAlumniFormModal(c)); 
  });
  
  displayAdminAlumniList();
}

function displayAdminAlumniList(searchTerm = '') {
  const container = document.getElementById('admin-alumni-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  const lowerSearch = searchTerm.toLowerCase();
  const alumniList = LOCAL_DB.alumni; 
  
  let count = 0;
  alumniList.forEach(alum => {
    const name = (alum.name || '').toLowerCase();
    const company = (alum.company || '').toLowerCase();
    const degree = (alum.degree || '').toLowerCase();
    const year = (alum.year || '').toString();
    
    if (lowerSearch && !name.includes(lowerSearch) && !company.includes(lowerSearch) && !degree.includes(lowerSearch) && !year.includes(lowerSearch)) {
      return;
    }
    count++;

    const card = document.createElement('div');
    card.className = 'list-card'; 
    card.innerHTML = `
      <div class="list-card-info">
        <div>
          <strong>${escapeHtml(alum.name)} (${alum.year})</strong>
          <span>${escapeHtml(alum.degree)} | ${escapeHtml(alum.email)}</span>
        </div>
      </div>
      <button class="btn small ghost" data-id="${alum.id}">Edit</button>
    `;
    
    card.querySelector('button').addEventListener('click', () => {
      openModal(c => renderAlumniFormModal(c, alum)); 
    });
    
    container.appendChild(card);
  });
  
  if (count === 0) {
     container.innerHTML = `<p class="page-center-message">No records found matching your search.</p>`;
  }
}

function renderAlumniFormModal(container, alum = {}) {
  const isEdit = !!alum.id;
  
  container.innerHTML = `
    <h3>${isEdit ? 'Edit Alumni Record' : 'Create New Alumni Record'}</h3>
    <p class="small-note">This is the official student record, separate from their social profile.</p>
    <div class='form-row'><input id='al_name' type='text' placeholder='Full Name' value='${escapeHtml(alum.name || '')}' /></div>
    <div class='form-row'><input id='al_email' type='email' placeholder='Contact Email' value='${escapeHtml(alum.email || '')}' /></div>
    <div class='form-row'><input id='al_phone' type='tel' placeholder='Phone' value='${escapeHtml(alum.phone || '')}' /></div>
    <div class='form-row'><input id='al_degree' type='text' placeholder='Degree (e.g., B.Tech CSE)' value='${escapeHtml(alum.degree || '')}' /></div>
    <div class='form-row'><input id='al_year' type='number' placeholder='Year of Graduation' value='${escapeHtml(alum.year || '')}' /></div>
    <div class='form-row'><input id='al_company' type='text' placeholder='Last Known Company' value='${escapeHtml(alum.company || '')}' /></div>
    <div class='form-row'><input id='al_location' type='text' placeholder='Location (City, Country)' value='${escapeHtml(alum.location || '')}' /></div>
    <div class='form-actions'>
      ${isEdit ? `<button id='delAl' class='btn danger' style="margin-right: auto; border-radius: 8px;">Delete Record</button>` : ""}
      <button id='saveAl' class='btn'>Save Record</button>
    </div>
  `;
  
  container.querySelector('#saveAl').addEventListener('click', () => {
    const data = {
      name: container.querySelector('#al_name').value,
      email: container.querySelector('#al_email').value,
      phone: container.querySelector('#al_phone').value,
      degree: container.querySelector('#al_degree').value,
      year: container.querySelector('#al_year').value,
      company: container.querySelector('#al_company').value,
      location: container.querySelector('#al_location').value,
    };
    
    if (isEdit) {
      const index = LOCAL_DB.alumni.findIndex(a => a.id === alum.id);
      LOCAL_DB.alumni[index] = {...alum, ...data};
    } else {
      data.id = 'al_' + Date.now();
      LOCAL_DB.alumni.push(data);
    }
    STORAGE.saveDB();
    closeModal();
    renderAdminDatabasePage(); 
  });

  if (isEdit) {
    container.querySelector('#delAl').addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete the official record for ${alum.name}? This cannot be undone.`)) {
        LOCAL_DB.alumni = LOCAL_DB.alumni.filter(a => a.id !== alum.id);
        STORAGE.saveDB();
        closeModal();
        renderAdminDatabasePage();
      }
    });
  }
}


/* ======================================================
   SOCIAL & ENGAGEMENT PAGES (For All Users)
========================================================= */

/* ---------- HOME FEED PAGE (Social) ---------- */
function renderHomePage() {
  setPageLoading(DOM.pageFeed);
  
  DOM.pageFeed.innerHTML = `
    <div class="create-post-card">
      <textarea id="create-post-text" placeholder="Share an update, ${currentUserProfile.name}?"></textarea>
      <div class="create-post-actions">
        <button id="create-post-btn" class="btn">Post</button>
      </div>
    </div>
    <div id="feed-container"></div>
  `;
  
  document.getElementById('create-post-btn').addEventListener('click', handleCreatePost);
  
  const feedContainer = document.getElementById('feed-container');
  const posts = LOCAL_DB.posts.sort((a, b) => b.timestamp - a.timestamp);
  
  if (posts.length === 0) {
    feedContainer.innerHTML = `<p class="page-center-message">No posts yet. Be the first to share!</p>`;
    return;
  }
  
  posts.forEach(post => {
    feedContainer.appendChild(createPostCard(post));
  });
}

function createPostCard(postData) {
  const card = document.createElement('div');
  card.className = 'post-card';
  
  const userHasLiked = postData.likes.includes(currentUserProfile.uid);
  const localPfp = STORAGE.getPfpLocal(postData.authorUID);
  const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
  const avatarInitial = postData.authorName.charAt(0).toUpperCase();

  card.innerHTML = `
    <div class="post-card-header">
      <div class="post-avatar" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
      <div class="post-author-info">
        <strong>${escapeHtml(postData.authorName)}</strong>
        <span>${new Date(postData.timestamp).toLocaleString()}</span>
      </div>
    </div>
    <div class="post-card-body">
      ${escapeHtml(postData.content)}
    </div>
    <div class="post-card-actions">
      <button class="action-btn ${userHasLiked ? 'liked' : ''}" data-post-id="${postData.id}" data-action="like">
        <i class="fas fa-thumbs-up"></i> Like (${postData.likes.length})
      </button>
      <button class="action-btn" data-post-id="${postData.id}" data-action="comment">
        <i class="fas fa-comment"></i> Comment
      </button>
    </div>
  `;
  
  card.querySelector('[data-action="like"]').addEventListener('click', () => handleLikePost(postData.id));
  card.querySelector('[data-action="comment"]').addEventListener('click', () => alert('Commenting coming soon!'));
  
  return card;
}

function handleCreatePost() {
  const content = document.getElementById('create-post-text').value;
  if (!content.trim()) return;

  const newPost = {
    id: 'p_' + Date.now(),
    content: content,
    authorName: currentUserProfile.name,
    authorUID: currentUserProfile.uid,
    likes: [],
    comments: [],
    timestamp: Date.now()
  };

  LOCAL_DB.posts.push(newPost);
  STORAGE.saveDB();
  renderHomePage();
}

function handleLikePost(postId) {
  const post = LOCAL_DB.posts.find(p => p.id === postId);
  if (!post) return;
  
  const uid = currentUserProfile.uid;
  if (post.likes.includes(uid)) {
    post.likes = post.likes.filter(id => id !== uid);
  } else {
    post.likes.push(uid);
  }
  
  STORAGE.saveDB();
  
  const feedContainer = document.getElementById('feed-container');
  setPageLoading(feedContainer);
  const posts = LOCAL_DB.posts.sort((a, b) => b.timestamp - a.timestamp);
  feedContainer.innerHTML = '';
  posts.forEach(p => {
    feedContainer.appendChild(createPostCard(p));
  });
}


/* ---------- DIRECTORY PAGE (Social) ---------- */
function renderDirectoryPage() {
  setPageLoading(DOM.pageDirectory);
  
  DOM.pageDirectory.innerHTML = `
    <div class="toolbar directory-toolbar">
      <input type="text" id="directory-search" placeholder="Search ${LOCAL_DB.users.length} social profiles..." />
    </div>
    <div id="directory-list-container"></div>
  `;
  
  document.getElementById('directory-search').addEventListener('input', (e) => {
    displayDirectoryList(e.target.value);
  });
  
  displayDirectoryList();
}

function displayDirectoryList(searchTerm = '') {
  const container = document.getElementById('directory-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  const lowerSearch = searchTerm.toLowerCase();
  
  LOCAL_DB.users.forEach(user => {
    const name = (user.name || '').toLowerCase();
    const company = (user.company || '').toLowerCase();
    const role = (user.role || '').toLowerCase();
    
    if (lowerSearch && !name.includes(lowerSearch) && !company.includes(lowerSearch) && !role.includes(lowerSearch)) {
      return;
    }

    const localPfp = STORAGE.getPfpLocal(user.uid);
    const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
    const avatarInitial = user.name.charAt(0).toUpperCase();

    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `
      <div class="list-card-info">
        <div class="post-avatar" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
        <div>
          <strong>${escapeHtml(user.name)}</strong>
          <span>${escapeHtml(user.jobTitle || user.role)} ${user.company ? `at ${escapeHtml(user.company)}` : ''}</span>
        </div>
      </div>
      <button class="btn small ghost" data-uid="${user.uid}">View Profile</button>
    `;
    
    card.querySelector('button').addEventListener('click', () => {
      navigateTo('page-profile', 'Social Profile', { uid: user.uid });
    });
    
    container.appendChild(card);
  });
}

/* ---------- EVENTS PAGE ---------- */
function renderEventsPage() {
  setPageLoading(DOM.pageEvents);
  const events = LOCAL_DB.events.sort((a, b) => new Date(b.date) - new Date(a.date));

  const user = currentUserProfile;
  DOM.pageEvents.innerHTML = '';
  
  const top = document.createElement('div');
  top.className = 'toolbar';
  top.innerHTML = `<div>${events.length} upcoming events</div>`;
  if (user && user.role === 'admin') {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.textContent = 'Create Event';
    b.addEventListener('click', () => openModal(renderEventForm));
    top.appendChild(b);
  }
  DOM.pageEvents.appendChild(top);
  
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  DOM.pageEvents.appendChild(grid);
  
  if (events.length === 0) {
    grid.innerHTML = `<p class="page-center-message" style="grid-column: 1 / -1;">No events scheduled.</p>`;
  }
  
  events.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'info-card'; 
    card.innerHTML = `
      <h4>${escapeHtml(ev.title)}</h4>
      <p><strong>When:</strong> ${escapeHtml(ev.date)}</p>
      <p><strong>Where:</strong> ${escapeHtml(ev.location)}</p>
      <p style="font-size: 0.9rem; color: var(--text-color);">${escapeHtml(ev.desc)}</p>
    `;
    grid.appendChild(card);
  });
}

function renderEventForm(container, ev = {}) {
  const isEdit = !!ev.id;
  container.innerHTML = `
    <h3>${isEdit ? 'Edit Event' : 'Create New Event'}</h3>
    <div class='form-row'><input id='ev_title' type='text' placeholder='Event Title' value='${escapeHtml(ev.title || '')}' /></div>
    <div class='form-row'><input id='ev_date' type='date' value='${escapeHtml(ev.date || '')}' /></div>
    <div class='form-row'><input id='ev_loc' type='text' placeholder='Location (e.g. Auditorium)' value='${escapeHtml(ev.location || '')}' /></div>
    <div class='form-row'><textarea id='ev_desc' placeholder='Event Description'>${escapeHtml(ev.desc || '')}</textarea></div>
    <div class='form-actions'>
      <button id='saveEv' class='btn'>Save Event</button>
    </div>
  `;

  container.querySelector('#saveEv').addEventListener('click', () => {
    const data = {
      title: container.querySelector('#ev_title').value,
      date: container.querySelector('#ev_date').value,
      location: container.querySelector('#ev_loc').value,
      desc: container.querySelector('#ev_desc').value,
    };
    
    if (isEdit) {
      const index = LOCAL_DB.events.findIndex(e => e.id === ev.id);
      LOCAL_DB.events[index] = {...ev, ...data};
    } else {
      data.id = 'ev_' + Date.now();
      LOCAL_DB.events.push(data);
    }
    STORAGE.saveDB();
    closeModal();
    renderEventsPage();
  });
}

/* ---------- CAREERS PAGE ---------- */
function renderCareersPage() {
  setPageLoading(DOM.pageCareers);
  const jobs = LOCAL_DB.careers.sort((a, b) => b.postedOn - a.postedOn);

  const user = currentUserProfile;
  DOM.pageCareers.innerHTML = '';
  
  const top = document.createElement('div');
  top.className = 'toolbar';
  top.innerHTML = `<div>${jobs.length} open positions</div>`;
  if (user && user.role === 'admin') {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.textContent = 'Post a Job';
    b.addEventListener('click', () => openModal(renderCareerForm));
    top.appendChild(b);
  }
  DOM.pageCareers.appendChild(top);
  
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  DOM.pageCareers.appendChild(grid);
  
  if (jobs.length === 0) {
    grid.innerHTML = `<p class="page-center-message" style="grid-column: 1 / -1;">No jobs posted right now.</p>`;
  }
  
  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.innerHTML = `
      <h4>${escapeHtml(job.title)}</h4>
      <p>${escapeHtml(job.company)} · ${escapeHtml(job.location || '')}</p>
      <button class='btn' onclick="openModal(c => renderJobView(c, '${job.id}'))">
        View Job
      </button>
    `;
    grid.appendChild(card);
  });
}

function renderCareerForm(container, job = {}) {
  const isEdit = !!job.id;
  container.innerHTML = `
    <h3>${isEdit ? 'Edit Job Post' : 'Post New Job'}</h3>
    <div class='form-row'><input id='job_title' type='text' placeholder='Job Title' value='${escapeHtml(job.title || '')}' /></div>
    <div class='form-row'><input id='job_company' type='text' placeholder='Company Name' value='${escapeHtml(job.company || '')}' /></div>
    <div class='form-row'><input id='job_location' type='text' placeholder='Location (e.g. Remote, City)' value='${escapeHtml(job.location || '')}' /></div>
    <div class='form-row'><input id='job_apply' type='url' placeholder='Application Link (https://...)' value='${escapeHtml(job.applyLink || '')}' /></div>
    <div class='form-row'><textarea id='job_desc' placeholder='Job Description'>${escapeHtml(job.desc || '')}</textarea></div>
    <div class='form-actions'>
      <button id='saveJob' class='btn'>${isEdit ? 'Save Changes' : 'Post Job'}</button>
    </div>
  `;

  container.querySelector('#saveJob').addEventListener('click', () => {
    const data = {
      title: container.querySelector('#job_title').value,
      company: container.querySelector('#job_company').value,
      location: container.querySelector('#job_location').value,
      applyLink: container.querySelector('#job_apply').value,
      desc: container.querySelector('#job_desc').value,
      postedOn: Date.now()
    };
    
    if (isEdit) {
      const index = LOCAL_DB.careers.findIndex(c => c.id === job.id);
      LOCAL_DB.careers[index] = {...job, ...data};
    } else {
      data.id = 'c_' + Date.now();
      LOCAL_DB.careers.push(data);
    }
    STORAGE.saveDB();
    closeModal();
    renderCareersPage();
  });
}
function renderJobView(container, jobId) {
  const job = LOCAL_DB.careers.find(c => c.id === jobId);
  if (!job) return container.innerHTML = "Job not found.";
  
  container.innerHTML = `
    <h3>${escapeHtml(job.title)}</h3>
    <p><strong>Company:</strong> ${escapeHtml(job.company)}</p>
    <p><strong>Location:</strong> ${escapeHtml(job.location)}</p>
    <hr/>
    <p style="white-space: pre-wrap;">${escapeHtml(job.desc)}</p>
    <div class='form-actions'>
      <a href='${escapeHtml(job.applyLink)}' target='_blank' class='btn'>Apply Now</a>
    </div>
  `;
}

/* ---------- MENTORSHIP PAGE ---------- */
function renderMentorshipPage() {
  setPageLoading(DOM.pageMentorship);
  const mentors = LOCAL_DB.mentors;

  const user = currentUserProfile;
  DOM.pageMentorship.innerHTML = '';
  
  const top = document.createElement('div');
  top.className = 'toolbar';
  top.innerHTML = `<div>${mentors.length} mentors available</div>`;
  
  const isMentor = mentors.find(m => m.uid === user.uid);
  
  const b = document.createElement('button');
  b.className = 'btn small';
  b.textContent = isMentor ? 'Edit Mentor Profile' : 'Become a Mentor';
  b.addEventListener('click', () => openModal(c => renderMentorForm(c, isMentor)));
  top.appendChild(b);

  DOM.pageMentorship.appendChild(top);
  
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  DOM.pageMentorship.appendChild(grid);
  
  if (mentors.length === 0) {
    grid.innerHTML = `<p class="page-center-message" style="grid-column: 1 / -1;">No mentors have signed up yet.</p>`;
  }
  
  mentors.forEach(mentor => {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.innerHTML = `
      <h4>${escapeHtml(mentor.name)}</h4>
      <p><strong>Expertise:</strong> ${escapeHtml(mentor.domain)}</p>
      <p style="font-size: 0.9rem; color: var(--text-color);">${escapeHtml(mentor.bio)}</p>
      <button class='btn' data-uid="${mentor.uid}">
        Request Mentorship
      </button>
    `;
    card.querySelector('button').addEventListener('click', () => {
        const targetUser = LOCAL_DB.users.find(u => u.uid === mentor.uid);
        if(targetUser) {
            navigateTo('page-chat', `Chat with ${targetUser.name}`, { user: targetUser });
        }
    });
    grid.appendChild(card);
  });
}

function renderMentorForm(container, mentorData = null) {
  const isEdit = !!mentorData;
  container.innerHTML = `
    <h3>${isEdit ? 'Edit Mentor Profile' : 'Become a Mentor'}</h3>
    <p class="small-note">Share your expertise with the alumni community.</p>
    <div class='form-row'><input id='m_domain' type='text' placeholder='Expertise (e.g. AI, Marketing)' value="${isEdit ? escapeHtml(mentorData.domain) : ''}" /></div>
    <div class='form-row'><textarea id='m_bio' placeholder='Short bio (what can you help with?)'>${isEdit ? escapeHtml(mentorData.bio) : ''}</textarea></div>
    <div class='form-actions'>
      ${isEdit ? `<button id='m_delete' class='btn danger' style='margin-right: auto; border-radius: 8px;'>Remove Profile</button>` : ''}
      <button id='m_save' class='btn'>Save Profile</button>
    </div>
  `;
  
  container.querySelector('#m_save').addEventListener('click', () => {
    const data = {
      uid: currentUserProfile.uid, 
      name: currentUserProfile.name,
      domain: container.querySelector('#m_domain').value,
      bio: container.querySelector('#m_bio').value,
    };
    
    if (isEdit) {
      const index = LOCAL_DB.mentors.findIndex(m => m.uid === currentUserProfile.uid);
      LOCAL_DB.mentors[index] = {...mentorData, ...data};
    } else {
      data.id = 'm_' + Date.now();
      LOCAL_DB.mentors.push(data);
    }
    STORAGE.saveDB();
    closeModal();
    renderMentorshipPage();
  });
  
  if (isEdit) {
    container.querySelector('#m_delete').addEventListener('click', () => {
      if (confirm("Are you sure you want to remove yourself from the mentorship list?")) {
        LOCAL_DB.mentors = LOCAL_DB.mentors.filter(m => m.uid !== currentUserProfile.uid);
        STORAGE.saveDB();
        closeModal();
        renderMentorshipPage();
      }
    });
  }
}


/* ---------- MESSAGES PAGE (Chat List) ---------- */
function renderMessagesPage() {
  setPageLoading(DOM.pageMessages);
  drawMessageList();
}
function drawMessageList() {
  DOM.pageMessages.innerHTML = ''; 
  LOCAL_DB.users.forEach(user => {
    if (user.uid === currentUserProfile.uid) return;
    
    const localPfp = STORAGE.getPfpLocal(user.uid);
    const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
    const avatarInitial = user.name.charAt(0).toUpperCase();

    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `
      <div class="list-card-info">
        <div class="post-avatar" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
        <div>
          <strong>${escapeHtml(user.name)}</strong>
          <span>${escapeHtml(user.role)}</span>
        </div>
      </div>
      <button class="btn small" data-uid="${user.uid}">Message</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      // NEW: Navigate to the actual chat page
      navigateTo('page-chat', `Chat with ${user.name}`, { user: user });
    });
    DOM.pageMessages.appendChild(card);
  });
}

/* ---------- NEW: CHAT PAGE (The actual chat window) ---------- */
function _renderChatPage(targetUser) {
  // targetUser can be undefined if context is not passed correctly
  if (!targetUser) {
    DOM.pageChat.innerHTML = `<p class="page-center-message">Error: No user selected for chat.</p>`;
    return;
  }
  
  const page = DOM.pageChat;
  setPageLoading(page);
  
  const localPfp = STORAGE.getPfpLocal(targetUser.uid);
  const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
  const avatarInitial = targetUser.name.charAt(0).toUpperCase();

  page.innerHTML = `
    <div class="chat-window">
      <div class="chat-header">
        <div class="post-avatar" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
        <strong>${escapeHtml(targetUser.name)}</strong>
      </div>
      <div class="chat-messages" id="chat-message-list">
        </div>
      <div class="chat-input-bar">
        <input type="text" id="chat-message-input" placeholder="Type a message..." />
        <button class="btn" id="chat-send-btn"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;

  const messageContainer = page.querySelector('#chat-message-list');
  renderChatMessages(messageContainer, targetUser.uid);

  // Add listener for sending
  page.querySelector('#chat-send-btn').addEventListener('click', () => {
    sendChatMessage(targetUser);
  });
  page.querySelector('#chat-message-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage(targetUser);
    }
  });
}

function renderChatMessages(container, targetUID) {
  container.innerHTML = '';
  const myUID = currentUserProfile.uid;
  
  const conversation = LOCAL_DB.messages.filter(msg => 
    (msg.senderUID === myUID && msg.receiverUID === targetUID) || 
    (msg.senderUID === targetUID && msg.receiverUID === myUID)
  ).sort((a, b) => a.timestamp - b.timestamp); // Sort oldest to newest

  if (conversation.length === 0) {
    container.innerHTML = `<p class="page-center-message" style="padding: 1rem; font-size: 0.9rem;">Start the conversation!</p>`;
  }

  conversation.forEach(msg => {
    const bubble = document.createElement('div');
    const type = msg.senderUID === myUID ? 'sent' : 'received';
    bubble.className = `message-bubble ${type}`;
    bubble.textContent = msg.content;
    container.appendChild(bubble);
  });
  
  container.scrollTop = container.scrollHeight; // Auto-scroll to bottom
}

function sendChatMessage(targetUser) {
  const input = document.getElementById('chat-message-input');
  const content = input.value.trim();
  if (!content) return;

  const newMessage = {
    id: 'msg_' + Date.now(),
    senderUID: currentUserProfile.uid,
    receiverUID: targetUser.uid,
    content: content,
    timestamp: Date.now()
  };

  LOCAL_DB.messages.push(newMessage);
  STORAGE.saveDB();

  // Re-render messages instantly
  const messageContainer = document.getElementById('chat-message-list');
  renderChatMessages(messageContainer, targetUser.uid);
  input.value = ''; // Clear input
  input.focus(); // Focus input after sending
}


/* ---------- PROFILE PAGE (Social Profile) ---------- */
function renderProfilePage(uid) {
  setPageLoading(DOM.pageProfile);
  const profileData = LOCAL_DB.users.find(u => u.uid === uid);
  
  if (!profileData) {
    DOM.pageProfile.innerHTML = `<p class="page-center-message">User profile not found.</p>`;
    return;
  }
  
  const isSelf = profileData.uid === currentUserProfile.uid;
  
  const localPfp = STORAGE.getPfpLocal(profileData.uid);
  const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
  const avatarInitial = profileData.name.charAt(0).toUpperCase();
  
  DOM.pageProfile.innerHTML = `
    <div class="profile-header-card">
      <div class="profile-picture-container">
        <div class="profile-picture" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
        ${isSelf ? `
          <label for="pfp-upload-input" id="pfp-upload-btn" title="Change profile picture">
            <i class="fas fa-camera"></i>
          </label>
          <input type="file" id="pfp-upload-input" accept="image/*" />
        ` : ''}
      </div>
      <div class="profile-info-main">
        <h2>${escapeHtml(profileData.name)}</h2>
        <p>${escapeHtml(profileData.jobTitle || 'Role not specified')}</p>
        <p>${escapeHtml(profileData.location || 'Location not specified')}</p>
        ${isSelf ? `<button id="edit-profile-btn" class="btn small ghost" style="margin-top: 1rem;">Edit My Social Profile</button>` : `<button id="message-user-btn" class="btn small" style="margin-top: 1rem;">Message</button>`}
      </div>
    </div>
    
    <div class="profile-card">
      <h3>About</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(profileData.bio || 'No bio set.')}</p>
    </div>
    
    <div class="profile-card">
      <h3>Info</h3>
      ${profileData.company ? `
        <div class="info-row">
          <i class="fas fa-briefcase"></i>
          <div>
            <strong>${escapeHtml(profileData.jobTitle || 'Works at')}</strong>
            <span>${escapeHtml(profileData.company)}</span>
          </div>
        </div>
      ` : ''}
      <div class="info-row">
        <i class="fas fa-phone"></i>
        <div>
          <strong>Phone</strong>
          <span>${escapeHtml(profileData.phone || 'Not provided')}</span>
        </div>
      </div>
      <div class="info-row">
        <i class="fas fa-envelope"></i>
        <div>
          <strong>Email</strong>
          <span>${escapeHtml(profileData.email)}</span>
        </div>
      </div>
      <div class="info-row">
        <i class="fas fa-user-tag"></i>
        <div>
          <strong>Role</strong>
          <span style="text-transform: capitalize;">${escapeHtml(profileData.role)}</span>
        </div>
      </div>
    </div>
  `;
  
  if (isSelf) {
    document.getElementById('edit-profile-btn').addEventListener('click', () => openModal(renderMyProfileForm));
    document.getElementById('pfp-upload-input').addEventListener('change', handleProfilePicUpload);
  } else {
    document.getElementById('message-user-btn').addEventListener('click', () => {
      navigateTo('page-chat', `Chat with ${profileData.name}`, { user: profileData });
    });
  }
}

async function handleProfilePicUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) { 
    alert("Error: File is too large (Max 2MB).");
    return;
  }

  const btn = document.getElementById('pfp-upload-btn');
  btn.innerHTML = `<div class="loader-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>`;

  try {
    const base64String = await fileToBase64(file);
    STORAGE.savePfpLocal(currentUserProfile.uid, base64String);
    currentUserProfile.localPhoto = base64String;
    renderProfilePage(currentUserProfile.uid);
  } catch (error) {
    console.error("Error saving profile pic:", error);
    alert("Error uploading picture.");
    btn.innerHTML = `<i class="fas fa-camera"></i>`;
  }
}

function renderMyProfileForm(container) {
  const user = currentUserProfile;
  container.innerHTML = `
    <h3>Edit My Social Profile</h3>
    <div class='form-row'><input id='prof_name' type='text' placeholder='Full Name' value='${escapeHtml(user.name || '')}' /></div>
    <div class='form-row'><input id='prof_phone' type='tel' placeholder='Phone Number' value='${escapeHtml(user.phone || '')}' /></div>
    <div class='form-row'><input id='prof_company' type='text' placeholder='Company' value='${escapeHtml(user.company || '')}' /></div>
    <div class='form-row'><input id='prof_job' type='text' placeholder='Job Title (e.g. Software Engineer)' value='${escapeHtml(user.jobTitle || '')}' /></div>
    <div class='form-row'><input id='prof_location' type='text' placeholder='Location (e.g. City, Country)' value='${escapeHtml(user.location || '')}' /></div>
    <div class='form-row'><textarea id='prof_bio' placeholder='Short Bio'>${escapeHtml(user.bio || '')}</textarea></div>
    <div class='form-actions'>
      <button id='saveProfile' class='btn'>Save Changes</button>
    </div>
  `;
  container.querySelector('#saveProfile').addEventListener('click', () => {
    const updatedProfile = {
      name: container.querySelector('#prof_name').value,
      phone: container.querySelector('#prof_phone').value,
      company: container.querySelector('#prof_company').value,
      jobTitle: container.querySelector('#prof_job').value,
      location: container.querySelector('#prof_location').value,
      bio: container.querySelector('#prof_bio').value,
    };
    
    const userIndex = LOCAL_DB.users.findIndex(u => u.uid === user.uid);
    LOCAL_DB.users[userIndex] = { ...user, ...updatedProfile };
    STORAGE.saveDB();
    
    currentUserProfile = { ...user, ...updatedProfile };
    
    closeModal();
    renderProfilePage(user.uid); 
    alert('Profile updated!');
  });
}


/* ---------- SETTINGS MODAL ---------- */
function renderSettingsModal(container) {
  const emailNotifsOn = PREFS.getNotifPref();
  container.innerHTML = `
    <h3>Settings</h3>
    <div class="settings-item">
      <span>Dark Mode</span>
      <label class="switch">
        <input type="checkbox" id="themeToggle" ${PREFS.getTheme() === 'dark' ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
    <div class="settings-item">
      <span>Email Notifications (Demo)</span>
      <label class="switch">
        <input type="checkbox" id="notifToggle" ${emailNotifsOn ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="settings-item">
      <button id="privacy-btn" style="background:none; border:none; color: var(--text-color); padding: 0.5rem 0; cursor:pointer; font-size: 1rem; text-align: left;">Privacy Policy</button>
    </div>
    <div class="settings-item">
      <button id="terms-btn" style="background:none; border:none; color: var(--text-color); padding: 0.5rem 0; cursor:pointer; font-size: 1rem; text-align: left;">Terms & Regulations</button>
    </div>

    <div class="settings-item" style="padding-top: 1rem; padding-bottom: 1rem;">
      <button class="btn danger" id="logout-btn">Logout</button>
    </div>
  `;
  container.querySelector('#themeToggle').addEventListener('change', toggleDarkMode);
  container.querySelector('#notifToggle').addEventListener('change', (e) => {
    PREFS.saveNotifPref(e.target.checked);
  });
  container.querySelector('#logout-btn').addEventListener('click', logout);
  
  // NEW: Add listeners for new settings buttons
  container.querySelector('#privacy-btn').addEventListener('click', () => {
    openModal(renderPrivacyPolicy);
  });
  container.querySelector('#terms-btn').addEventListener('click', () => {
    openModal(renderTerms);
  });
}

/**
 * NEW: Renders Privacy Policy in modal
 */
function renderPrivacyPolicy(container) {
  container.innerHTML = `
    <h3>Privacy Policy</h3>
    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
    <p>Your privacy is important to us. This Alumni Platform is a local-only demo and does not collect or transmit any personal data to any server.</p>
    <h4>Data Storage</h4>
    <p>All data you provide, including your profile information, posts, messages, and official alumni records (for admins), is stored locally in your web browser's <strong>localStorage</strong>. This data does not leave your computer.</p>
    <h4>Profile Pictures</h4>
    <p>Profile pictures you upload are converted to a Base64 string and also stored in your localStorage. They are not uploaded to any server.</p>
    <h4>Security</h4>
    <p>Because all data is local, its security is dependent on the security of your computer and your web browser. Clearing your browser's site data will permanently delete all users, posts, messages, and other information associated with this app.</p>
    <div class='form-actions'>
      <button id='back-settings-btn' class='btn'>Back to Settings</button>
    </div>
  `;
  container.querySelector('#back-settings-btn').addEventListener('click', () => openModal(renderSettingsModal));
}

/**
 * NEW: Renders Terms & Regs in modal
 */
function renderTerms(container) {
  container.innerHTML = `
    <h3>Terms & Regulations</h3>
    <p>This is a demonstration application. By using it, you agree to the following terms:</p>
    <ol style="padding-left: 1.5rem;">
      <li style="margin-bottom: 0.5rem;"><strong>No Guarantees:</strong> This app is for demo purposes only. There is no guarantee of data persistence. Clearing your browser cache will delete all data.</li>
      <li style="margin-bottom: 0.5rem;"><strong>Local Data:</strong> You acknowledge that all data is stored locally on your device and not on a secure, remote server.</li>
      <li style="margin-bottom: 0.5rem;"><strong>No Real-World Use:</strong> This application is not intended for real-world use for managing sensitive alumni information.</li>
      <li style="margin-bottom: 0.5rem;"><strong>Liability:</strong> The creator of this application assumes no liability for any data loss or issues arising from its use.</li>
    </ol>
    <div class='form-actions'>
      <button id='back-settings-btn' class='btn'>Back to Settings</button>
    </div>
  `;
  container.querySelector('#back-settings-btn').addEventListener('click', () => openModal(renderSettingsModal));
}


function toggleDarkMode(e) {
  if (e.target.checked) {
    document.body.classList.add('dark-mode');
    PREFS.saveTheme('dark');
  } else {
    document.body.classList.remove('dark-mode');
    PREFS.saveTheme('light');
  }
}

function applyTheme() {
  if (PREFS.getTheme() === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

/* ---------- BOOT (APPLICATION START) ---------- */

function applyRolePermissions() {
  const adminBtn = DOM.mainNavList.querySelector('.admin-only');
  const defaultUserPage = 'page-feed';
  const defaultUserTitle = 'Social Feed';
  const defaultAdminPage = 'page-admin';
  const defaultAdminTitle = 'Alumni Records';
  
  const context = {}; // Default empty context

  if (currentUserProfile.role === 'admin') {
    adminBtn.classList.remove('hidden');
    _renderPage(defaultAdminPage, defaultAdminTitle, context, true);
    // *** TRACKPAD FIX ***
    history.replaceState({ pageId: defaultAdminPage, pageTitle: defaultAdminTitle, context }, defaultAdminTitle, `#${defaultAdminPage}`);
  } else {
    adminBtn.classList.add('hidden');
    _renderPage(defaultUserPage, defaultUserTitle, context, true);
    // *** TRACKPAD FIX ***
    history.replaceState({ pageId: defaultUserPage, pageTitle: defaultUserTitle, context }, defaultUserTitle, `#${defaultUserPage}`);
  }
}

function showApp(user) {
  currentUserProfile = user;
  
  const localPfp = STORAGE.getPfpLocal(user.uid);
  if (localPfp) {
    currentUserProfile.localPhoto = localPfp;
  }
  
  DOM.appContainer.classList.remove('hidden');
  DOM.authContainer.classList.add('hidden');
  
  pageStack = []; // Clear history on login
  applyRolePermissions(); // This now sets the correct default page AND browser history state
}

function init() {
  applyTheme();
  STORAGE.getDB(); // Load the local database into memory
  
  const loggedInUID = sessionStorage.getItem('alumniUserUID');
  
  if (loggedInUID) {
    const user = LOCAL_DB.users.find(u => u.uid === loggedInUID);
    if (user) {
      showApp(user);
    } else {
      sessionStorage.removeItem('alumniUserUID');
      DOM.authContainer.classList.remove('hidden');
      renderAuthPage();
    }
  } else {
    DOM.authContainer.classList.remove('hidden');
    renderAuthPage();
  }
  
  DOM.globalLoader.classList.add('hidden');
  
  // Add Nav Listener to all buttons in the list
  DOM.mainNavList.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (!navItem) return;

      pageStack = []; // Reset history stack
      const pageId = navItem.dataset.page;
      const pageTitle = navItem.querySelector('span').textContent;
      
      const context = {}; // Base pages have no context
      
      _renderPage(pageId, pageTitle, context, true);
      
      // *** TRACKPAD FIX ***
      // Reset browser history to this new base page
      history.pushState({ pageId, pageTitle, context }, pageTitle, `#${pageId}`);
      
      if (DOM.sidebar.classList.contains('active')) {
          toggleSidebar(false); // Close sidebar on nav click (mobile)
      }
    });
  });

  // *** NEW: Add listeners for shell controls ***
  DOM.hamburgerBtn.addEventListener('click', () => toggleSidebar());
  DOM.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
  DOM.backBtn.addEventListener('click', goBack);
  
  // *** BUG FIX: This line was broken in the previous version ***
  DOM.settingsBtn.addEventListener('click', () => openModal(renderSettingsModal));
  DOM.modalCloseBtn.addEventListener('click', closeModal);
  
  // *** TRACKPAD FIX ***
  // Add the popstate listener
  window.addEventListener('popstate', handlePopState);
}

// Utility function
function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Start the application
init();