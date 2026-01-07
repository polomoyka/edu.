const API_URL = 'http://localhost:3000';

const academicData = [
    {
        name: "Веб-технології та веб-дизайн",
        labs: [ { id: 1, max: 5 }, { id: 2, max: 5 }, { id: 3, max: 5 } ]
    },
    {
        name: "Вища математика",
        labs: [ { id: 1, max: 5 }, { id: 2, max: 5 } ]
    },
    {
        name: "Філософія",
        labs: [ { id: 1, max: 7 }, { id: 2, max: 7 },{ id: 1, max: 7 },{ id: 1, max: 7 } ]
    }
];

const booksData = [
    { title: "Основи Python", author: "Марк Лутц", link: "https://www.google.com" },
    { title: "Чистий код", author: "Роберт Мартін", link: "#" },
    { title: "JavaScript для дітей", author: "Нік Морган", link: "#" },
    { title: "HTML5 та CSS3", author: "Брайан Хоган", link: "#" }
];

let libraryData = [];
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const toggleLink = document.getElementById('toggle-auth-link');
    const confirmField = document.getElementById('confirm-password-container');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');
    
    const googleBtn = document.getElementById('google-login');
    const appleBtn = document.getElementById('apple-login');

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const mockUser = { email: "google.user@gmail.com", name: "Google User", group: "ПЗ-21", role: "student" };
            loginSuccess(mockUser.email, mockUser);
            alert("Успішний вхід через Google!");
        });
    }

    if (appleBtn) {
        appleBtn.addEventListener('click', () => {
            const mockUser = { email: "apple.user@icloud.com", name: "Apple User", group: "ПЗ-21", role: "student" };
            loginSuccess(mockUser.email, mockUser);
            alert("Успішний вхід через Apple ID!");
        });
    }

    let isLoginMode = true;

    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            if (messageBox) messageBox.innerText = '';
            formTitle.innerText = isLoginMode ? "Увійдіть в аккаунт" : "Реєстрація";
            submitBtn.innerText = isLoginMode ? "Увійти" : "Зареєструватися";
            confirmField.style.display = isLoginMode ? "none" : "block";
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;

            if (isLoginMode) {
                // --- ЛОГІН ---
                try {
                    const response = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        loginSuccess(email, result.user);
                    } else {
                        showMessage(result.message || "Помилка входу.");
                    }
                } catch (err) {
                    console.error(err);
                    showMessage("Помилка з'єднання з сервером.");
                }
            } else {
                const confirmPassword = document.getElementById('confirm-password').value;
                if (password !== confirmPassword) {
                    showMessage("Паролі не збігаються!");
                    return;
                }
                
                const newUser = { email, password, name: "Новий Студент", group: "ПЗ-21" };
                
                try {
                    const response = await fetch(`${API_URL}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newUser)
                    });
                    const result = await response.json();

                    if (result.success) {
                        showMessage("Успішно! Тепер увійдіть.", "success");
                        setTimeout(() => toggleLink.click(), 1000);
                    } else {
                        showMessage(result.message || "Помилка реєстрації.");
                    }
                } catch (err) {
                    console.error(err);
                    showMessage("Помилка з'єднання з сервером.");
                }
            }
        });
    }
    loadLibraryData();
});

function loginSuccess(email, user) {
    localStorage.setItem('currentUserEmail', email);
    localStorage.setItem('currentUserName', user.name);
    
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    
    const adminLink = document.getElementById('admin-link');
    const teacherLink = document.getElementById('teacher-link');
    
    // Скидання відображення кнопок
    adminLink.style.display = 'none';
    teacherLink.style.display = 'none';

    // Перевірка ролі (з сервера або хардкод)
    if (user.role === 'admin' || email === 'admin@lpnu.ua') {
        adminLink.style.display = 'block';
        showSection('admin');
    } else if (user.role === 'teacher' || email === 'teacher@lpnu.ua') {
        teacherLink.style.display = 'block';
        showSection('teacher');
    } else {
        showSection('main');
    }

    const profileNameEl = document.getElementById('user-profile-name');
    if (profileNameEl) profileNameEl.innerText = user.name;
}

function showMessage(text, type = 'error') {
    const box = document.getElementById('message-box');
    if (!box) return;
    box.innerText = text;
    box.style.color = type === 'success' ? 'green' : 'red';
}

window.logout = () => { 
    localStorage.removeItem('currentUserEmail'); 
    localStorage.removeItem('currentUserName');
    location.reload(); 
};

window.showSection = function(id) {
    document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
    
    const activeSection = document.getElementById(`${id}-section`);
    if (activeSection) {
        activeSection.style.display = 'block';
    } else if (id === 'main') {
        document.getElementById('main-section').style.display = 'block';
    }

    if (id === 'education') {
        loadSchedule();
        loadAcademicProcess();
    }
    if (id === 'social') loadComments();
    if (id === 'admin') updateAdminStats();
    if (id === 'library') searchBooks();
};

async function loadLibraryData() {
    try {
        const response = await fetch('data/library.json');
        libraryData = await response.json();
    } catch (e) { 
        console.log("Локальна бібліотека порожня або відсутня");
        libraryData = []; 
    }
}

window.searchBooks = function() {
    const query = document.getElementById('library-search').value.toLowerCase().trim();
    const resultsList = document.getElementById('book-results');
    resultsList.innerHTML = "";

    // Об'єднуємо статичні книги та завантажені
    const allBooks = [...booksData, ...libraryData];
    
    const filtered = allBooks.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));
    
    if (filtered.length === 0) {
        resultsList.innerHTML = '<li style="color: #64748b; padding: 10px;">Книг не знайдено</li>';
        return;
    }

    resultsList.innerHTML = filtered.map(book => `
        <li class="finance-item" style="list-style:none; margin-bottom:10px; display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #f1f5f9;">
            <div>
                <strong style="color: #1e293b;">${book.title}</strong><br>
                <small style="color: #64748b;">${book.author}</small>
            </div>
            <a href="${book.link}" target="_blank" class="status success" style="text-decoration:none; background: #f0fdf4; color: #16a34a; padding: 5px 12px; border-radius: 6px;">Читати</a>
        </li>`).join('');
};

window.uploadToLibrary = function() {
    const titleInput = document.getElementById('lib-upload-title');
    const fileInput = document.getElementById('lib-upload-file');
    const title = titleInput.value.trim();
    const file = fileInput.files[0];

    if (!title || !file) {
        alert("Заповніть назву та оберіть файл!");
        return;
    }

    const newItem = {
        title: title,
        author: "Викладач",
        link: URL.createObjectURL(file),
        fileName: file.name
    };

    libraryData.push(newItem);
    alert(`Файл "${file.name}" додано до бібліотеки!`);
    titleInput.value = "";
    fileInput.value = "";
    searchBooks(); 
};

function loadAcademicProcess() {
    const email = localStorage.getItem('currentUserEmail');
    const globalGrades = JSON.parse(localStorage.getItem('global_grades')) || {};
    const list = document.getElementById('subjects-list');
    if (!list) return;
    
    list.innerHTML = academicData.map((subject, index) => {
        const studentGrades = globalGrades[email]?.[subject.name] || [];
        return `
        <div class="subject-item">
            <button class="subject-header" onclick="toggleSubject(${index})">
                ${subject.name} <span id="arrow-${index}">▼</span>
            </button>
            <div id="subject-content-${index}" class="subject-content" style="display:none; padding:15px; background:#f9f9f9;">
                ${subject.labs.map(lab => {
                    const grade = studentGrades.find(g => g.id === lab.id)?.score;
                    return `
                    <div class="lab-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>Лабораторна №${lab.id}</span>
                        <span class="${grade ? 'grade-badge' : 'not-graded'}">
                            ${grade ? grade + '/' + lab.max : 'не оцінено'}
                        </span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');
}

window.toggleSubject = (idx) => {
    const el = document.getElementById(`subject-content-${idx}`);
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
};

async function loadSchedule() {
    const email = localStorage.getItem('currentUserEmail');
    const students = JSON.parse(localStorage.getItem('students')) || []; 
    const group = "ПЗ-21"; 

    try {
        const res = await fetch('data/schedule.json');
        const data = await res.json();
        const container = document.getElementById('schedule-content');
        if (!container) return;
        
        if (data[group]) {
            container.innerHTML = Object.entries(data[group]).map(([day, lessons]) => `
                <strong>${day}</strong>: ${lessons.map(l => l.subject).join(', ')}<br>
            `).join('');
        } else {
            container.innerHTML = `<p style="color:orange;">Розклад для групи ${group} ще не завантажено.</p>`;
        }
    } catch(e) { console.log('Помилка завантаження розкладу'); }
}

window.toggleSchedule = () => {
    const el = document.getElementById('schedule-content');
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
};

window.loadGroupForTeacher = function() {
    const group = document.getElementById('teacher-group-select').value;
    const subject = document.getElementById('teacher-subject-select').value;
    const journal = document.getElementById('teacher-journal');
    
    if (!group || !subject) return;

    let students = JSON.parse(localStorage.getItem('students')) || []; 
    
    let groupStudents = students.filter(s => s.group === group);
    let globalGrades = JSON.parse(localStorage.getItem('global_grades')) || {};

    if (groupStudents.length === 0) {
        journal.innerHTML = "<p>У цій групі немає студентів (або дані на сервері, а тут локально).</p>";
        return;
    }

    journal.innerHTML = groupStudents.map(student => {
        const studentGrades = globalGrades[student.email]?.[subject] || [];
        return `
        <div class="finance-item" style="margin-bottom:15px; flex-direction:column; align-items:flex-start; background:#fff; padding:15px; border-radius:8px; border:1px solid #eee;">
            <strong>${student.name}</strong>
            <div style="display:flex; gap:10px; margin-top:10px;">
                ${[1, 2, 3].map(labId => {
                    const grade = studentGrades.find(g => g.id === labId)?.score || "";
                    return `
                    <div style="text-align:center;">
                        <small>Лаб ${labId}</small><br>
                        <input type="number" value="${grade}" min="0" max="5" 
                            style="width:45px; padding:5px; border:1px solid #ccc; border-radius:4px;"
                            onchange="saveGrade('${student.email}', '${subject}', ${labId}, this.value)">
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');
};

window.saveGrade = function(email, subject, labId, score) {
    let globalGrades = JSON.parse(localStorage.getItem('global_grades')) || {};
    if (!globalGrades[email]) globalGrades[email] = {};
    if (!globalGrades[email][subject]) globalGrades[email][subject] = [];

    const labIdx = globalGrades[email][subject].findIndex(g => g.id === labId);
    if (labIdx > -1) globalGrades[email][subject][labIdx].score = score;
    else globalGrades[email][subject].push({ id: labId, score: score, max: 5 });

    localStorage.setItem('global_grades', JSON.stringify(globalGrades));
};

function loadComments() {
    const list = document.getElementById('comments-list');
    const comments = JSON.parse(localStorage.getItem('forum_comments')) || [];
    if(list) list.innerHTML = comments.map(c => `<div class="forum-message"><strong>${c.name}:</strong> ${c.text}</div>`).join('');
}

window.addComment = function() {
    const text = document.getElementById('comment-text').value;
    if (!text) return;
    const name = document.getElementById('user-profile-name').innerText;
    const comments = JSON.parse(localStorage.getItem('forum_comments')) || [];
    comments.push({ name, text });
    localStorage.setItem('forum_comments', JSON.stringify(comments));
    document.getElementById('comment-text').value = "";
    loadComments();
};

window.openSurvey = () => {
    document.getElementById('survey-modal').style.display = 'flex';
    document.getElementById('setup-name').value = localStorage.getItem('currentUserName') || "";
};

window.saveProfile = function() {
    const name = document.getElementById('setup-name').value;
    if (!name) { alert("Введіть ім'я!"); return; }
    
    document.getElementById('user-profile-name').innerText = name;
    localStorage.setItem('currentUserName', name);
    document.getElementById('survey-modal').style.display = 'none';
};

function updateAdminStats() {
    document.getElementById('total-students').innerText = "Див. JSON";
    const bookCountEl = document.getElementById('total-books');
    if (bookCountEl) bookCountEl.innerText = libraryData.length + booksData.length;

    const tableBody = document.getElementById('admin-users-list');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Дані зберігаються у файлі student.json на сервері</td></tr>`;
    }
}

window.clearAllData = function() {
    if (confirm("Це очистить лише локальні оцінки та коментарі. Користувачі на сервері залишаться. Продовжити?")) {
        localStorage.removeItem('global_grades');
        localStorage.removeItem('forum_comments');
        localStorage.removeItem('students'); 
        location.reload();
    }
};