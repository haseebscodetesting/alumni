/* ---------- DOM & STATE ---------- */
const DOM = {
  globalLoader: document.getElementById('global-loader'),
  authContainer: document.getElementById('auth-container'),
  appContainer: document.getElementById('app-container'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  pageTitle: document.getElementById('page-title'),
  appContent: document.querySelector('.app-content'),
  mainNavList: document.querySelector('.nav-list'),
  backBtn: document.getElementById('back-btn'),
  hamburgerBtn: document.getElementById('hamburger-btn'),
  settingsBtn: document.getElementById('settings-btn'), 
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
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modal-body'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
};

/* ======================================================
   LOCAL DATABASE 
========================================================= */
let LOCAL_DB = {}; 

const STORAGE = {
  getDB: () => {
    const db = localStorage.getItem('alumniAppDB');
    if (db) {
      LOCAL_DB = JSON.parse(db);
    } else {
      LOCAL_DB = {
        users: [
          { uid: 'u_admin', name: 'Admin User', email: 'admin', pass: 'admin', role: 'admin', company: 'CampusLink', jobTitle: 'Site Administrator', bio: 'I manage this platform.', location: 'Main Campus', phone: '111-222-3333' },
          { uid: 'u_user', name: 'Demo Alumni', email: 'user', pass: 'user', role: 'user', company: 'Google', jobTitle: 'Software Engineer', bio: 'Excited to be part of this community!', location: 'New York, NY', phone: '444-555-6666' }
        ],
        alumni: [
          { id: 'al_1', name: 'John Doe', email: 'john@example.com', phone: '1234567890', degree: 'B.Tech CSE', year: 2018, company: 'Google', location: 'Mountain View, USA'},
          { id: 'al_2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', degree: 'M.Tech AI', year: 2020, company: 'Microsoft', location: 'Redmond, USA'},
        ],
        events: [
          {id: 'ev_1', title: 'Annual Alumni Meet 2026', date: '2026-12-20', location: 'University Auditorium', desc: 'The grand annual alumni reunion.'}
        ],
        careers: [
          {id: 'car_1', title: 'Software Engineer II', company: 'Google', location: 'Remote', applyLink: '#', desc: 'Looking for a skilled engineer...', postedOn: Date.now()}
        ],
        mentors: [
           {id: 'm_1', uid: 'u_user', name: 'Demo Alumni (user)', domain: 'Software Engineering, Cloud', bio: 'Happy to help with career advice!'}
        ],
        posts: [], 
        messages: [] 
      };
      STORAGE.saveDB();
    }
  },
  saveDB: () => { localStorage.setItem('alumniAppDB', JSON.stringify(LOCAL_DB)); },
  savePfpLocal: (uid, base64String) => {
    try { localStorage.setItem(`pfp_${uid}`, base64String); } 
    catch (e) { alert("Could not save profile picture. Browser storage might be full."); }
  },
  getPfpLocal: (uid) => { return localStorage.getItem(`pfp_${uid}`); }
};

let currentUserProfile = null;
let pageStack = []; 

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchAlumniFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/alumni/`);
    if (!response.ok) throw new Error("Failed to fetch API");
    return await response.json(); // Converts the Python API response to a JS array
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

/* ---------- NEW THEME PREFS ---------- */
const PREFS = {
  getMode: () => localStorage.getItem('themeMode') || 'light',
  saveMode: mode => localStorage.setItem('themeMode', mode),
  getAccent: () => localStorage.getItem('themeAccent') || 'green',
  saveAccent: accent => localStorage.setItem('themeAccent', accent),
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

function navigateTo(pageId, pageTitle, context = {}) {
  const currentPage = document.querySelector('.page-content.active');
  if (!currentPage) return; 
  
  if (pageStack.length > 0 && pageStack[pageStack.length - 1].id === currentPage.id) {
    if (pageId !== 'page-chat') {
        pageStack.pop(); 
    }
  }

  pageStack.push({
    id: currentPage.id,
    title: DOM.pageTitle.textContent,
    pageFunction: () => _renderPage(currentPage.id, DOM.pageTitle.textContent, {}, false),
  });

  _renderPage(pageId, pageTitle, context, true);
  history.pushState({ pageId, pageTitle, context }, pageTitle, `#${pageId}`);
 
  if (DOM.sidebar.classList.contains('active')) toggleSidebar(false);
}

function goBack() { history.back(); }

function handlePopState(e) {
  const lastPage = pageStack.pop();
  if (!lastPage) {
    applyRolePermissions();
    return;
  }
  lastPage.pageFunction();
  updateTopBar(lastPage.title, pageStack.length > 0);
}

function _renderPage(pageId, pageTitle, context = {}, isNewPage = false) {
  DOM.allPages.forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  if (isNewPage) {
     updateNavButtons(pageId);
     updateTopBar(pageTitle, pageStack.length > 0); 
  }
  
  switch(pageId) {
    case 'page-admin': renderAdminDatabasePage(); break;
    case 'page-feed': renderHomePage(); break;
    case 'page-directory': renderDirectoryPage(); break;
    case 'page-events': renderEventsPage(); break;
    case 'page-careers': renderCareersPage(); break;
    case 'page-mentorship': renderMentorshipPage(); break;
    case 'page-messages': renderMessagesPage(); break;
    case 'page-profile': renderProfilePage(context.uid || currentUserProfile.uid); break;
    case 'page-chat': _renderChatPage(context.user); break;
  }
}

/* ---------- AUTHENTICATION ---------- */
function renderAuthPage() {
  DOM.authContainer.innerHTML = `
    <div class="auth-box">
      <div style="text-align: center; font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"><i class="fas fa-link"></i></div>
      <h2>Welcome to CampusLink</h2>
      <p style="text-align: center; color: var(--text-light); margin-bottom: 2rem;">Sign in to connect with your network.</p>
      <div class='form-row'><input id='auth_email' type='text' placeholder='Email (or "admin")' value="admin"/></div>
      <div class='form-row'><input id='auth_pass' type='password' placeholder='Password' value="admin"/></div>
      <div class='form-actions'>
        <button id='loginBtn' class='btn' style="width: 100%;">Sign In</button>
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
      <p style="text-align: center; color: var(--text-light); margin-bottom: 2rem;">Join the alumni network today.</p>
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
        <button id='registerBtn' class='btn' style="width: 100%;">Sign Up</button>
      </div>
      <div class="auth-toggle">
        Already have an account? <span onclick="renderAuthPage()">Log In</span>
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

  if (LOCAL_DB.users.find(u => u.email === email)) return alert('An account with this email already exists.');
  
  const newUser = {
    uid: 'u_' + Date.now(), name: name, email: email, pass: pass, role: role,
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
  history.replaceState(null, '', 'index.html');
}

/* ======================================================
   ADMIN & SOCIAL PAGES (Unchanged Logic, Styling automatically applies)
========================================================= */

async function renderAdminDatabasePage() {
  setPageLoading(DOM.pageAdmin);
  
  // 1. Fetch REAL data from your Python backend!
  const alumniData = await fetchAlumniFromAPI();
  
  DOM.pageAdmin.innerHTML = `
    <div class="toolbar directory-toolbar">
      <input type="text" id="admin-alumni-search" placeholder="Search ${alumniData.length} official alumni records..." />
      <button id="add-alumni-btn" class="btn">Add New Record</button>
    </div>
    <div id="admin-alumni-list-container"></div>
  `;
  
  // 2. Pass the fetched data into the display function
  document.getElementById('admin-alumni-search').addEventListener('input', (e) => {
    displayAdminAlumniList(alumniData, e.target.value);
  });
  
  document.getElementById('add-alumni-btn').addEventListener('click', () => {
    openModal(c => renderAlumniFormModal(c)); 
  });
  
  displayAdminAlumniList(alumniData);
}

// 3. Update the display function to accept the API array instead of using LOCAL_DB
function displayAdminAlumniList(alumniList, searchTerm = '') {
  const container = document.getElementById('admin-alumni-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  const lowerSearch = searchTerm.toLowerCase();
  
  let count = 0;
  alumniList.forEach(alum => {
    const name = (alum.name || '').toLowerCase();
    const company = (alum.company || '').toLowerCase();
    
    if (lowerSearch && !name.includes(lowerSearch) && !company.includes(lowerSearch)) return;
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
    <div class='form-row'><input id='al_name' type='text' placeholder='Full Name' value='${escapeHtml(alum.name || '')}' /></div>
    <div class='form-row'><input id='al_email' type='email' placeholder='Contact Email' value='${escapeHtml(alum.email || '')}' /></div>
    <div class='form-row'><input id='al_phone' type='tel' placeholder='Phone' value='${escapeHtml(alum.phone || '')}' /></div>
    <div class='form-row'><input id='al_degree' type='text' placeholder='Degree (e.g., B.Tech CSE)' value='${escapeHtml(alum.degree || '')}' /></div>
    <div class='form-row'><input id='al_year' type='number' placeholder='Year of Graduation' value='${escapeHtml(alum.year || '')}' /></div>
    <div class='form-row'><input id='al_company' type='text' placeholder='Last Known Company' value='${escapeHtml(alum.company || '')}' /></div>
    <div class='form-row'><input id='al_location' type='text' placeholder='Location (City, Country)' value='${escapeHtml(alum.location || '')}' /></div>
    <div class='form-actions'>
      ${isEdit ? `<button id='delAl' class='btn danger' style="margin-right: auto;">Delete</button>` : ""}
      <button id='saveAl' class='btn ${isEdit ? '' : 'btn-primary'}'>Save Record</button>
    </div>
  `;

  // --- SAVE BUTTON LOGIC (POST OR PUT) ---
  container.querySelector('#saveAl').addEventListener('click', async () => {
    const data = {
      name: container.querySelector('#al_name').value, 
      email: container.querySelector('#al_email').value,
      phone: container.querySelector('#al_phone').value, 
      degree: container.querySelector('#al_degree').value,
      year: parseInt(container.querySelector('#al_year').value, 10), 
      company: container.querySelector('#al_company').value,
      location: container.querySelector('#al_location').value,
    };
    
    try {
      if (isEdit) {
        // Update existing record in PostgreSQL
        await fetch(`${API_BASE_URL}/alumni/${alum.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        // Create new record in PostgreSQL
        await fetch(`${API_BASE_URL}/alumni/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      closeModal(); 
      renderAdminDatabasePage(); // Re-fetch the live database
    } catch (error) {
      alert("Error communicating with the database.");
      console.error(error);
    }
  });

  // --- DELETE BUTTON LOGIC (DELETE) ---
  if (isEdit) {
    container.querySelector('#delAl').addEventListener('click', async () => {
      if (confirm(`Delete official record for ${alum.name}?`)) {
        try {
          await fetch(`${API_BASE_URL}/alumni/${alum.id}/`, {
            method: 'DELETE'
          });
          closeModal(); 
          renderAdminDatabasePage(); // Re-fetch the live database
        } catch (error) {
          alert("Error deleting record.");
          console.error(error);
        }
      }
    });
  }
}
function renderHomePage() {
  setPageLoading(DOM.pageFeed);
  DOM.pageFeed.innerHTML = `
    <div class="create-post-card">
      <textarea id="create-post-text" placeholder="Share an update, ${currentUserProfile.name}?"></textarea>
      <div class="create-post-actions">
        <button id="create-post-btn" class="btn">Post Update</button>
      </div>
    </div>
    <div id="feed-container"></div>
  `;
  document.getElementById('create-post-btn').addEventListener('click', handleCreatePost);
  const feedContainer = document.getElementById('feed-container');
  const posts = LOCAL_DB.posts.sort((a, b) => b.timestamp - a.timestamp);
  
  if (posts.length === 0) return feedContainer.innerHTML = `<p class="page-center-message">No posts yet. Be the first to share!</p>`;
  posts.forEach(post => feedContainer.appendChild(createPostCard(post)));
}

function createPostCard(postData) {
  const card = document.createElement('div'); card.className = 'post-card';
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
    <div class="post-card-body">${escapeHtml(postData.content)}</div>
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
  const newPost = { id: 'p_' + Date.now(), content: content, authorName: currentUserProfile.name, authorUID: currentUserProfile.uid, likes: [], comments: [], timestamp: Date.now() };
  LOCAL_DB.posts.push(newPost); STORAGE.saveDB(); renderHomePage();
}

function handleLikePost(postId) {
  const post = LOCAL_DB.posts.find(p => p.id === postId);
  if (!post) return;
  const uid = currentUserProfile.uid;
  post.likes.includes(uid) ? post.likes = post.likes.filter(id => id !== uid) : post.likes.push(uid);
  STORAGE.saveDB(); renderHomePage(); // Quick re-render for prototype
}

function renderDirectoryPage() {
  setPageLoading(DOM.pageDirectory);
  DOM.pageDirectory.innerHTML = `
    <div class="toolbar directory-toolbar">
      <input type="text" id="directory-search" placeholder="Search ${LOCAL_DB.users.length} social profiles..." />
    </div>
    <div id="directory-list-container" class="card-grid"></div>
  `;
  document.getElementById('directory-search').addEventListener('input', (e) => displayDirectoryList(e.target.value));
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
    if (lowerSearch && !name.includes(lowerSearch) && !company.includes(lowerSearch)) return;

    const localPfp = STORAGE.getPfpLocal(user.uid);
    const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
    const avatarInitial = user.name.charAt(0).toUpperCase();

    const card = document.createElement('div'); card.className = 'list-card';
    card.innerHTML = `
      <div class="list-card-info">
        <div class="post-avatar" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
        <div>
          <strong>${escapeHtml(user.name)}</strong>
          <span>${escapeHtml(user.jobTitle || user.role)} ${user.company ? `at ${escapeHtml(user.company)}` : ''}</span>
        </div>
      </div>
      <button class="btn small ghost" data-uid="${user.uid}">Profile</button>
    `;
    card.querySelector('button').addEventListener('click', () => navigateTo('page-profile', 'Social Profile', { uid: user.uid }));
    container.appendChild(card);
  });
}

function renderEventsPage() {
  setPageLoading(DOM.pageEvents);
  const events = LOCAL_DB.events.sort((a, b) => new Date(b.date) - new Date(a.date));
  DOM.pageEvents.innerHTML = '';
  
  const top = document.createElement('div'); top.className = 'toolbar';
  top.innerHTML = `<div>${events.length} upcoming events</div>`;
  if (currentUserProfile && currentUserProfile.role === 'admin') {
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = 'Create Event';
    b.addEventListener('click', () => openModal(renderEventForm)); top.appendChild(b);
  }
  DOM.pageEvents.appendChild(top);
  
  const grid = document.createElement('div'); grid.className = 'card-grid'; DOM.pageEvents.appendChild(grid);
  if (events.length === 0) return grid.innerHTML = `<p class="page-center-message" style="grid-column: 1 / -1;">No events scheduled.</p>`;
  
  events.forEach(ev => {
    const card = document.createElement('div'); card.className = 'info-card'; 
    card.innerHTML = `
      <h4>${escapeHtml(ev.title)}</h4>
      <p><strong>When:</strong> ${escapeHtml(ev.date)}<br><strong>Where:</strong> ${escapeHtml(ev.location)}</p>
      <p style="font-size: 0.9rem;">${escapeHtml(ev.desc)}</p>
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
    <div class='form-actions'><button id='saveEv' class='btn'>Save Event</button></div>
  `;
  container.querySelector('#saveEv').addEventListener('click', () => {
    const data = { title: container.querySelector('#ev_title').value, date: container.querySelector('#ev_date').value, location: container.querySelector('#ev_loc').value, desc: container.querySelector('#ev_desc').value };
    if (isEdit) {
      const index = LOCAL_DB.events.findIndex(e => e.id === ev.id); LOCAL_DB.events[index] = {...ev, ...data};
    } else {
      data.id = 'ev_' + Date.now(); LOCAL_DB.events.push(data);
    }
    STORAGE.saveDB(); closeModal(); renderEventsPage();
  });
}

function renderCareersPage() {
  setPageLoading(DOM.pageCareers);
  const jobs = LOCAL_DB.careers.sort((a, b) => b.postedOn - a.postedOn);
  DOM.pageCareers.innerHTML = '';
  
  const top = document.createElement('div'); top.className = 'toolbar';
  top.innerHTML = `<div>${jobs.length} open positions</div>`;
  if (currentUserProfile && currentUserProfile.role === 'admin') {
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = 'Post a Job';
    b.addEventListener('click', () => openModal(renderCareerForm)); top.appendChild(b);
  }
  DOM.pageCareers.appendChild(top);
  
  const grid = document.createElement('div'); grid.className = 'card-grid'; DOM.pageCareers.appendChild(grid);
  if (jobs.length === 0) return grid.innerHTML = `<p class="page-center-message" style="grid-column: 1 / -1;">No jobs posted right now.</p>`;
  
  jobs.forEach(job => {
    const card = document.createElement('div'); card.className = 'info-card';
    card.innerHTML = `
      <h4>${escapeHtml(job.title)}</h4>
      <p>${escapeHtml(job.company)} · ${escapeHtml(job.location || '')}</p>
      <button class='btn ghost' onclick="openModal(c => renderJobView(c, '${job.id}'))">View Job</button>
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
    <div class='form-actions'><button id='saveJob' class='btn'>${isEdit ? 'Save Changes' : 'Post Job'}</button></div>
  `;
  container.querySelector('#saveJob').addEventListener('click', () => {
    const data = { title: container.querySelector('#job_title').value, company: container.querySelector('#job_company').value, location: container.querySelector('#job_location').value, applyLink: container.querySelector('#job_apply').value, desc: container.querySelector('#job_desc').value, postedOn: Date.now() };
    if (isEdit) {
      const index = LOCAL_DB.careers.findIndex(c => c.id === job.id); LOCAL_DB.careers[index] = {...job, ...data};
    } else {
      data.id = 'c_' + Date.now(); LOCAL_DB.careers.push(data);
    }
    STORAGE.saveDB(); closeModal(); renderCareersPage();
  });
}

function renderJobView(container, jobId) {
  const job = LOCAL_DB.careers.find(c => c.id === jobId);
  if (!job) return container.innerHTML = "Job not found.";
  container.innerHTML = `
    <h3>${escapeHtml(job.title)}</h3>
    <p><strong>Company:</strong> ${escapeHtml(job.company)}<br><strong>Location:</strong> ${escapeHtml(job.location)}</p>
    <hr/><p style="white-space: pre-wrap;">${escapeHtml(job.desc)}</p>
    <div class='form-actions'><a href='${escapeHtml(job.applyLink)}' target='_blank' class='btn'>Apply Now</a></div>
  `;
}

function renderMentorshipPage() {
  setPageLoading(DOM.pageMentorship);
  const mentors = LOCAL_DB.mentors;
  DOM.pageMentorship.innerHTML = '';
  
  const top = document.createElement('div'); top.className = 'toolbar';
  top.innerHTML = `<div>${mentors.length} mentors available</div>`;
  const isMentor = mentors.find(m => m.uid === currentUserProfile.uid);
  const b = document.createElement('button'); b.className = 'btn small'; b.textContent = isMentor ? 'Edit Mentor Profile' : 'Become a Mentor';
  b.addEventListener('click', () => openModal(c => renderMentorForm(c, isMentor))); top.appendChild(b);
  DOM.pageMentorship.appendChild(top);
  
  const grid = document.createElement('div'); grid.className = 'card-grid'; DOM.pageMentorship.appendChild(grid);
  if (mentors.length === 0) return grid.innerHTML = `<p class="page-center-message" style="grid-column: 1 / -1;">No mentors have signed up yet.</p>`;
  
  mentors.forEach(mentor => {
    const card = document.createElement('div'); card.className = 'info-card';
    card.innerHTML = `
      <h4>${escapeHtml(mentor.name)}</h4>
      <p><strong>Expertise:</strong> ${escapeHtml(mentor.domain)}</p>
      <p style="font-size: 0.9rem;">${escapeHtml(mentor.bio)}</p>
      <button class='btn ghost' data-uid="${mentor.uid}">Request Mentorship</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
        const targetUser = LOCAL_DB.users.find(u => u.uid === mentor.uid);
        if(targetUser) navigateTo('page-chat', `Chat with ${targetUser.name}`, { user: targetUser });
    });
    grid.appendChild(card);
  });
}

function renderMentorForm(container, mentorData = null) {
  const isEdit = !!mentorData;
  container.innerHTML = `
    <h3>${isEdit ? 'Edit Mentor Profile' : 'Become a Mentor'}</h3>
    <div class='form-row'><input id='m_domain' type='text' placeholder='Expertise (e.g. AI, Marketing)' value="${isEdit ? escapeHtml(mentorData.domain) : ''}" /></div>
    <div class='form-row'><textarea id='m_bio' placeholder='Short bio (what can you help with?)'>${isEdit ? escapeHtml(mentorData.bio) : ''}</textarea></div>
    <div class='form-actions'>
      ${isEdit ? `<button id='m_delete' class='btn danger' style='margin-right: auto;'>Remove Profile</button>` : ''}
      <button id='m_save' class='btn'>Save Profile</button>
    </div>
  `;
  container.querySelector('#m_save').addEventListener('click', () => {
    const data = { uid: currentUserProfile.uid, name: currentUserProfile.name, domain: container.querySelector('#m_domain').value, bio: container.querySelector('#m_bio').value };
    if (isEdit) {
      const index = LOCAL_DB.mentors.findIndex(m => m.uid === currentUserProfile.uid); LOCAL_DB.mentors[index] = {...mentorData, ...data};
    } else {
      data.id = 'm_' + Date.now(); LOCAL_DB.mentors.push(data);
    }
    STORAGE.saveDB(); closeModal(); renderMentorshipPage();
  });
  if (isEdit) {
    container.querySelector('#m_delete').addEventListener('click', () => {
      if (confirm("Remove yourself from the mentorship list?")) {
        LOCAL_DB.mentors = LOCAL_DB.mentors.filter(m => m.uid !== currentUserProfile.uid);
        STORAGE.saveDB(); closeModal(); renderMentorshipPage();
      }
    });
  }
}

function renderMessagesPage() {
  setPageLoading(DOM.pageMessages);
  DOM.pageMessages.innerHTML = '<div class="card-grid" id="msg-grid"></div>'; 
  const grid = document.getElementById('msg-grid');
  LOCAL_DB.users.forEach(user => {
    if (user.uid === currentUserProfile.uid) return;
    const localPfp = STORAGE.getPfpLocal(user.uid);
    const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
    const avatarInitial = user.name.charAt(0).toUpperCase();

    const card = document.createElement('div'); card.className = 'list-card';
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
    card.querySelector('button').addEventListener('click', () => navigateTo('page-chat', `Chat with ${user.name}`, { user: user }));
    grid.appendChild(card);
  });
}

function _renderChatPage(targetUser) {
  if (!targetUser) return DOM.pageChat.innerHTML = `<p class="page-center-message">Error: No user selected.</p>`;
  const page = DOM.pageChat; setPageLoading(page);
  
  const localPfp = STORAGE.getPfpLocal(targetUser.uid);
  const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
  const avatarInitial = targetUser.name.charAt(0).toUpperCase();

  page.innerHTML = `
    <div class="chat-window">
      <div class="chat-header">
        <div class="post-avatar" style="${avatarStyle}; width:36px; height:36px; font-size:0.9rem;">${avatarStyle ? '' : avatarInitial}</div>
        <strong>${escapeHtml(targetUser.name)}</strong>
      </div>
      <div class="chat-messages" id="chat-message-list"></div>
      <div class="chat-input-bar">
        <input type="text" id="chat-message-input" placeholder="Type a message..." autocomplete="off"/>
        <button class="btn" id="chat-send-btn"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
  const messageContainer = page.querySelector('#chat-message-list');
  renderChatMessages(messageContainer, targetUser.uid);
  page.querySelector('#chat-send-btn').addEventListener('click', () => sendChatMessage(targetUser));
  page.querySelector('#chat-message-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(targetUser); });
}

function renderChatMessages(container, targetUID) {
  container.innerHTML = '';
  const myUID = currentUserProfile.uid;
  const conversation = LOCAL_DB.messages.filter(msg => 
    (msg.senderUID === myUID && msg.receiverUID === targetUID) || (msg.senderUID === targetUID && msg.receiverUID === myUID)
  ).sort((a, b) => a.timestamp - b.timestamp); 

  if (conversation.length === 0) container.innerHTML = `<p class="page-center-message">Start the conversation!</p>`;

  conversation.forEach(msg => {
    const bubble = document.createElement('div');
    const type = msg.senderUID === myUID ? 'sent' : 'received';
    bubble.className = `message-bubble ${type}`; bubble.textContent = msg.content;
    container.appendChild(bubble);
  });
  container.scrollTop = container.scrollHeight; 
}

function sendChatMessage(targetUser) {
  const input = document.getElementById('chat-message-input');
  const content = input.value.trim(); if (!content) return;
  LOCAL_DB.messages.push({ id: 'msg_' + Date.now(), senderUID: currentUserProfile.uid, receiverUID: targetUser.uid, content: content, timestamp: Date.now() });
  STORAGE.saveDB(); renderChatMessages(document.getElementById('chat-message-list'), targetUser.uid);
  input.value = ''; input.focus(); 
}

function renderProfilePage(uid) {
  setPageLoading(DOM.pageProfile);
  const profileData = LOCAL_DB.users.find(u => u.uid === uid);
  if (!profileData) return DOM.pageProfile.innerHTML = `<p class="page-center-message">User profile not found.</p>`;
  
  const isSelf = profileData.uid === currentUserProfile.uid;
  const localPfp = STORAGE.getPfpLocal(profileData.uid);
  const avatarStyle = localPfp ? `background-image: url(${localPfp})` : '';
  const avatarInitial = profileData.name.charAt(0).toUpperCase();
  
  DOM.pageProfile.innerHTML = `
    <div class="profile-header-card">
      <div class="profile-picture-container">
        <div class="profile-picture" style="${avatarStyle}">${avatarStyle ? '' : avatarInitial}</div>
        ${isSelf ? `<label for="pfp-upload-input" id="pfp-upload-btn" title="Change profile picture"><i class="fas fa-camera"></i></label><input type="file" id="pfp-upload-input" accept="image/*" />` : ''}
      </div>
      <div class="profile-info-main">
        <h2>${escapeHtml(profileData.name)}</h2>
        <p>${escapeHtml(profileData.jobTitle || 'Role not specified')}</p>
        <p>${escapeHtml(profileData.location || 'Location not specified')}</p>
        ${isSelf ? `<button id="edit-profile-btn" class="btn small ghost" style="margin-top: 1rem;">Edit My Profile</button>` : `<button id="message-user-btn" class="btn small" style="margin-top: 1rem;">Message</button>`}
      </div>
    </div>
    
    <div class="profile-card">
      <h3>About</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(profileData.bio || 'No bio set.')}</p>
    </div>
    
    <div class="profile-card">
      <h3>Info</h3>
      ${profileData.company ? `
        <div class="info-row"><i class="fas fa-briefcase"></i><div><strong>${escapeHtml(profileData.jobTitle || 'Works at')}</strong><span>${escapeHtml(profileData.company)}</span></div></div>
      ` : ''}
      <div class="info-row"><i class="fas fa-phone"></i><div><strong>Phone</strong><span>${escapeHtml(profileData.phone || 'Not provided')}</span></div></div>
      <div class="info-row"><i class="fas fa-envelope"></i><div><strong>Email</strong><span>${escapeHtml(profileData.email)}</span></div></div>
      <div class="info-row"><i class="fas fa-user-tag"></i><div><strong>Role</strong><span style="text-transform: capitalize;">${escapeHtml(profileData.role)}</span></div></div>
    </div>
  `;
  
  if (isSelf) {
    document.getElementById('edit-profile-btn').addEventListener('click', () => openModal(renderMyProfileForm));
    document.getElementById('pfp-upload-input').addEventListener('change', handleProfilePicUpload);
  } else {
    document.getElementById('message-user-btn').addEventListener('click', () => navigateTo('page-chat', `Chat with ${profileData.name}`, { user: profileData }));
  }
}

async function handleProfilePicUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) return alert("Error: File is too large (Max 2MB).");
  
  const btn = document.getElementById('pfp-upload-btn');
  btn.innerHTML = `<div class="loader-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>`;
  try {
    const base64String = await fileToBase64(file); STORAGE.savePfpLocal(currentUserProfile.uid, base64String);
    currentUserProfile.localPhoto = base64String; renderProfilePage(currentUserProfile.uid);
  } catch (error) { alert("Error uploading picture."); btn.innerHTML = `<i class="fas fa-camera"></i>`; }
}

function renderMyProfileForm(container) {
  const user = currentUserProfile;
  container.innerHTML = `
    <h3>Edit Profile</h3>
    <div class='form-row'><input id='prof_name' type='text' placeholder='Full Name' value='${escapeHtml(user.name || '')}' /></div>
    <div class='form-row'><input id='prof_phone' type='tel' placeholder='Phone Number' value='${escapeHtml(user.phone || '')}' /></div>
    <div class='form-row'><input id='prof_company' type='text' placeholder='Company' value='${escapeHtml(user.company || '')}' /></div>
    <div class='form-row'><input id='prof_job' type='text' placeholder='Job Title' value='${escapeHtml(user.jobTitle || '')}' /></div>
    <div class='form-row'><input id='prof_location' type='text' placeholder='Location' value='${escapeHtml(user.location || '')}' /></div>
    <div class='form-row'><textarea id='prof_bio' placeholder='Short Bio'>${escapeHtml(user.bio || '')}</textarea></div>
    <div class='form-actions'><button id='saveProfile' class='btn'>Save Changes</button></div>
  `;
  container.querySelector('#saveProfile').addEventListener('click', () => {
    const updatedProfile = {
      name: container.querySelector('#prof_name').value, phone: container.querySelector('#prof_phone').value,
      company: container.querySelector('#prof_company').value, jobTitle: container.querySelector('#prof_job').value,
      location: container.querySelector('#prof_location').value, bio: container.querySelector('#prof_bio').value,
    };
    const userIndex = LOCAL_DB.users.findIndex(u => u.uid === user.uid);
    LOCAL_DB.users[userIndex] = { ...user, ...updatedProfile }; STORAGE.saveDB();
    currentUserProfile = { ...user, ...updatedProfile };
    closeModal(); renderProfilePage(user.uid); 
  });
}

/* ======================================================
   NEW THEME SETTINGS MODAL 
========================================================= */
function applyTheme() {
  const mode = PREFS.getMode();
  const accent = PREFS.getAccent();
  document.body.setAttribute('data-mode', mode);
  document.body.setAttribute('data-accent', accent);
}

function renderSettingsModal(container) {
  const currentMode = PREFS.getMode();
  const currentAccent = PREFS.getAccent();
  const emailNotifsOn = PREFS.getNotifPref();

  container.innerHTML = `
    <h3>Appearance & Settings</h3>
    
    <div class="theme-section">
      <h4>Theme Mode</h4>
      <div class="mode-selector">
        <div class="mode-card ${currentMode === 'light' ? 'active' : ''}" data-mode="light">Light</div>
        <div class="mode-card ${currentMode === 'dark' ? 'active' : ''}" data-mode="dark">Dark</div>
      </div>
    </div>

    <div class="theme-section">
      <h4>Accent Color</h4>
      <div class="accent-selector">
        <div class="color-swatch ${currentAccent === 'green' ? 'active' : ''}" data-accent="green" style="background: #10b981;" title="Campus Green"></div>
        <div class="color-swatch ${currentAccent === 'blue' ? 'active' : ''}" data-accent="blue" style="background: #3b82f6;" title="Ocean Blue"></div>
        <div class="color-swatch ${currentAccent === 'purple' ? 'active' : ''}" data-accent="purple" style="background: #8b5cf6;" title="Royal Purple"></div>
        <div class="color-swatch ${currentAccent === 'orange' ? 'active' : ''}" data-accent="orange" style="background: #f97316;" title="Sunset Orange"></div>
        <div class="color-swatch ${currentAccent === 'pink' ? 'active' : ''}" data-accent="pink" style="background: #ec4899;" title="Rose Pink"></div>
      </div>
    </div>

    <hr/>

    <div class="settings-item">
      <span>Email Notifications (Demo)</span>
      <label class="switch">
        <input type="checkbox" id="notifToggle" ${emailNotifsOn ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="settings-item">
      <button id="privacy-btn" style="background:none; border:none; color: var(--text-color); padding: 0.5rem 0; cursor:pointer; font-size: 1rem; text-align: left; font-weight: 500;">Privacy Policy</button>
    </div>
    <div class="settings-item">
      <button id="terms-btn" style="background:none; border:none; color: var(--text-color); padding: 0.5rem 0; cursor:pointer; font-size: 1rem; text-align: left; font-weight: 500;">Terms & Regulations</button>
    </div>

    <div class="settings-item" style="padding-top: 1.5rem; padding-bottom: 0;">
      <button class="btn danger" id="logout-btn" style="width: 100%;">Log Out</button>
    </div>
  `;

  // Dynamic Event Listeners for instantly switching themes
  container.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', (e) => {
      PREFS.saveMode(e.target.dataset.mode);
      applyTheme();
      renderSettingsModal(container); // Re-render to show active checkmark
    });
  });

  container.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      PREFS.saveAccent(e.target.dataset.accent);
      applyTheme();
      renderSettingsModal(container);
    });
  });

  container.querySelector('#notifToggle').addEventListener('change', (e) => PREFS.saveNotifPref(e.target.checked));
  container.querySelector('#logout-btn').addEventListener('click', logout);
  container.querySelector('#privacy-btn').addEventListener('click', () => openModal(renderPrivacyPolicy));
  container.querySelector('#terms-btn').addEventListener('click', () => openModal(renderTerms));
}

function renderPrivacyPolicy(container) {
  container.innerHTML = `
    <h3>Privacy Policy</h3>
    <p>All data you provide is stored locally in your web browser. This data does not leave your computer.</p>
    <div class='form-actions'><button id='back-settings-btn' class='btn ghost'>Back</button></div>
  `;
  container.querySelector('#back-settings-btn').addEventListener('click', () => openModal(renderSettingsModal));
}

function renderTerms(container) {
  container.innerHTML = `
    <h3>Terms & Regulations</h3>
    <p>This is a demonstration application.</p>
    <div class='form-actions'><button id='back-settings-btn' class='btn ghost'>Back</button></div>
  `;
  container.querySelector('#back-settings-btn').addEventListener('click', () => openModal(renderSettingsModal));
}

/* ---------- BOOT (APPLICATION START) ---------- */
function applyRolePermissions() {
  const adminBtn = DOM.mainNavList.querySelector('.admin-only');
  const defaultUserPage = 'page-feed'; const defaultUserTitle = 'Social Feed';
  const defaultAdminPage = 'page-admin'; const defaultAdminTitle = 'Alumni Records';
  
  if (currentUserProfile.role === 'admin') {
    adminBtn.classList.remove('hidden'); _renderPage(defaultAdminPage, defaultAdminTitle, {}, true);
    history.replaceState({ pageId: defaultAdminPage, pageTitle: defaultAdminTitle, context: {} }, defaultAdminTitle, `#${defaultAdminPage}`);
  } else {
    adminBtn.classList.add('hidden'); _renderPage(defaultUserPage, defaultUserTitle, {}, true);
    history.replaceState({ pageId: defaultUserPage, pageTitle: defaultUserTitle, context: {} }, defaultUserTitle, `#${defaultUserPage}`);
  }
}

function showApp(user) {
  currentUserProfile = user;
  const localPfp = STORAGE.getPfpLocal(user.uid);
  if (localPfp) currentUserProfile.localPhoto = localPfp;
  
  DOM.appContainer.classList.remove('hidden'); DOM.authContainer.classList.add('hidden');
  pageStack = []; applyRolePermissions(); 
}

function init() {
  applyTheme(); STORAGE.getDB(); 
  
  const loggedInUID = sessionStorage.getItem('alumniUserUID');
  if (loggedInUID) {
    const user = LOCAL_DB.users.find(u => u.uid === loggedInUID);
    user ? showApp(user) : (sessionStorage.removeItem('alumniUserUID'), DOM.authContainer.classList.remove('hidden'), renderAuthPage());
  } else {
    DOM.authContainer.classList.remove('hidden'); renderAuthPage();
  }
  DOM.globalLoader.classList.add('hidden');
  
  DOM.mainNavList.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item'); if (!navItem) return;
      pageStack = []; const pageId = navItem.dataset.page; const pageTitle = navItem.querySelector('span').textContent;
      _renderPage(pageId, pageTitle, {}, true);
      history.pushState({ pageId, pageTitle, context: {} }, pageTitle, `#${pageId}`);
      if (DOM.sidebar.classList.contains('active')) toggleSidebar(false); 
    });
  });

  DOM.hamburgerBtn.addEventListener('click', () => toggleSidebar());
  DOM.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
  DOM.backBtn.addEventListener('click', goBack);
  DOM.settingsBtn.addEventListener('click', () => openModal(renderSettingsModal));
  DOM.modalCloseBtn.addEventListener('click', closeModal);
  window.addEventListener('popstate', handlePopState);
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

init();