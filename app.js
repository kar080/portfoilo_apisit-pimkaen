// --- 1. ประกาศตัวแปรและดึง Element จาก HTML ---
let tasks = []; // อาร์เรย์สำหรับเก็บข้อมูลงานทั้งหมด

const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskSubjectInput = document.getElementById('taskSubject');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskStatusSelect = document.getElementById('taskStatus');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

// ตัวดึงข้อมูลค้นหาและกรอง
const searchTitle = document.getElementById('searchTitle');
const filterSubject = document.getElementById('filterSubject');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// รายการแสดงผล
const taskListContainer = document.getElementById('taskList');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// --- 2. ฟังก์ชันเริ่มระบบทำงาน (Initialization) ---
document.addEventListener('DOMContentLoaded', () => {
    // โหลดข้อมูลจาก Local Storage ถ้าไม่มีให้ใช้เป็นอาร์เรย์ว่าง
    const storedTasks = localStorage.getItem('my_tasks_data');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
    
    // โหลดธีมสีที่เคยเลือกไว้ ถ้าไม่มีให้ใช้ธีมเริ่มต้น (light = Cyber-Neon)
    const savedTheme = localStorage.getItem('my_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // เรียกทำงานฟังก์ชัน Event และวาดหน้าจอหลัก
    setupEventListeners();
    renderApp();
});

// --- 3. ฟังก์ชันดักจับเหตุการณ์ (Event Listeners) ---
function setupEventListeners() {
    // การส่งฟอร์ม (ทั้งเพิ่มและแก้ไข)
    taskForm.addEventListener('submit', saveTask);
    
    // ยกเลิกการแก้ไข
    cancelEditBtn.addEventListener('click', clearForm);
    
    // ดักจับการพิมพ์ค้นหาและการเลือกตัวกรอง
    searchTitle.addEventListener('input', renderApp);
    filterSubject.addEventListener('input', renderApp);
    filterStatus.addEventListener('change', renderApp);
    filterPriority.addEventListener('change', renderApp);
    
    // ปุ่มล้างงานที่ทำเสร็จแล้ว
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // ปุ่มสลับโหมด มืด/สว่าง
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// --- 4. ฟังก์ชันหลักในการรวมการแสดงผล (Render Application) ---
function renderApp() {
    // กรองข้อมูลตามที่ผู้ใช้กรอก/เลือก
    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTitle.value.toLowerCase());
        const matchesSubject = task.subject.toLowerCase().includes(filterSubject.value.toLowerCase());
        const matchesStatus = filterStatus.value === 'all' || task.status === filterStatus.value;
        const matchesPriority = filterPriority.value === 'all' || task.priority === filterPriority.value;
        
        return matchesSearch && matchesSubject && matchesStatus && matchesPriority;
    });

    // เรียงลำดับงานตามวันที่ส่ง (ส่งก่อนอยู่บน)
    filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // อัปเดตตัวเลขและข้อมูลบน Dashboard
    updateDashboard();

    // แสดงรายการงานในหน้าเว็บ
    taskListContainer.innerHTML = '';
    if (filteredTasks.length === 0) {
        taskListContainer.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-light);">❌ ไม่พบภารกิจที่ค้นหา</p>';
        return;
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item priority-${task.priority}`;
        
        // แปลงรูปแบบข้อความสถานะและระดับความสำคัญ
        const statusLabels = { pending: 'ยังไม่ทำ', doing: 'กำลังทำ', completed: 'เสร็จแล้ว' };
        const priorityLabels = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง' };
        
        // จัดรูปแบบวันที่ให้อ่านง่ายขึ้น
        const dateObj = new Date(task.dueDate);
        const formattedDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

        taskItem.innerHTML = `
            <div class="task-info">
                <h3>${task.title} <span class="badge badge-${task.status}">${statusLabels[task.status]}</span></h3>
                <div class="task-meta">
                    <span>📚 วิชา: ${task.subject}</span> | 
                    <span>📅 กำหนดส่ง: ${formattedDate}</span> | 
                    <span>🔥 ความสำคัญ: ${priorityLabels[task.priority]}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-secondary" onclick="editTask('${task.id}')">✏️ EDIT</button>
                <button class="btn btn-danger" onclick="deleteTask('${task.id}')">🗑️ DEL</button>
            </div>
        `;
        taskListContainer.appendChild(taskItem);
    });
}

// --- 5. ฟังก์ชันจัดการข้อมูล (CRUD Operations) ---

function saveTask(e) {
    e.preventDefault(); 

    const id = taskIdInput.value;
    const taskData = {
        id: id || Date.now().toString(), 
        title: taskTitleInput.value,
        subject: taskSubjectInput.value,
        dueDate: taskDueDateInput.value,
        priority: taskPrioritySelect.value,
        status: taskStatusSelect.value
    };

    if (id) {
        const index = tasks.findIndex(t => t.id === id);
        tasks[index] = taskData;
    } else {
        tasks.push(taskData);
    }

    saveToLocalStorage(); 
    clearForm();          
    renderApp();          
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskSubjectInput.value = task.subject;
    taskDueDateInput.value = task.dueDate;
    taskPrioritySelect.value = task.priority;
    taskStatusSelect.value = task.status;

    formTitle.innerText = '✏️ EDIT QUEST';
    saveBtn.innerText = '💾 UPDATE';
    cancelEditBtn.classList.remove('hidden');
    
    taskForm.scrollIntoView({ behavior: 'smooth' });
}

function deleteTask(id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveToLocalStorage();
        renderApp();
    }
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    if (completedCount === 0) {
        alert('ไม่มีภารกิจที่ทำเสร็จแล้วให้ล้างครับ');
        return;
    }
    if (confirm(`ต้องการลบงานที่ทำเสร็จแล้วทั้งหมดจำนวน ${completedCount} งาน ใช่หรือไม่?`)) {
        tasks = tasks.filter(t => t.status !== 'completed');
        saveToLocalStorage();
        renderApp();
    }
}

function clearForm() {
    taskIdInput.value = '';
    taskForm.reset();
    formTitle.innerText = '➕ ADD NEW QUEST';
    saveBtn.innerText = '💾 SAVE QUEST';
    cancelEditBtn.classList.add('hidden');
}

// --- 6. ฟังก์ชันจัดการแดชบอร์ด (Dashboard Logic) ---
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;

    document.getElementById('totalTasks').innerText = total;
    document.getElementById('pendingTasks').innerText = pending;
    document.getElementById('completedTasks').innerText = completed;

    const today = new Date();
    today.setHours(0,0,0,0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const urgentTasks = tasks.filter(task => {
        if (task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= threeDaysLater;
    });

    const urgentList = document.getElementById('urgentTasksList');
    urgentList.innerHTML = '';
    if (urgentTasks.length === 0) {
        urgentList.innerHTML = '<li>ไม่มีงานเร่งด่วนใน 3 วันนี้ 👍</li>';
    } else {
        urgentTasks.forEach(t => {
            urgentList.innerHTML += `<li><strong>${t.title}</strong> (วิชา ${t.subject}) ส่งวันที่ ${t.dueDate}</li>`;
        });
    }

    const subjectCounts = {};
    tasks.forEach(t => {
        subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1;
    });

    const subjectList = document.getElementById('subjectStatsList');
    subjectList.innerHTML = '';
    const subjects = Object.keys(subjectCounts);
    if (subjects.length === 0) {
        subjectList.innerHTML = '<li>ไม่มีข้อมูลรายวิชา</li>';
    } else {
        subjects.forEach(sub => {
            subjectList.innerHTML += `<li>📘 ${sub}: ${subjectCounts[sub]} งาน</li>`;
        });
    }
}

// --- 7. ฟังก์ชันจัดการ Local Storage & ปุ่มเปลี่ยนธีม (แก้ไขจุดบั๊กแล้ว) ---
function saveToLocalStorage() {
    localStorage.setItem('my_tasks_data', JSON.stringify(tasks));
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    // สลับค่าระหว่าง 'light' (Cyber-Neon) กับ 'dark' (Matrix)
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('my_theme', newTheme);
    
    // รีเรนเดอร์แอปพลิเคชันใหม่เพื่อให้สีของ UI และ Component ต่าง ๆ อัปเดตตามธีมทันที
    renderApp();
}
