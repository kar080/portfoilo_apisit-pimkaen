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
    
    // โหลดธีมสีที่เคยเลือกไว้
    const savedTheme = localStorage.getItem('my_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // ทำการประมวลผลการแสดงผลและแดชบอร์ด
    renderApp();
    setupEventListeners();
});

// --- 3. ฟังก์ชันจัดกิจกรรมตัวดักจับเหตุการณ์ (Event Listeners) ---
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

    // บันทึกและแสดงผลสถิติ Dashboard
    updateDashboard();

    // แสดงรายการงานในหน้าเว็บ
    taskListContainer.innerHTML = '';
    if (filteredTasks.length === 0) {
        taskListContainer.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-light);">ไม่พบรายการงาน</p>';
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
                <button class="btn btn-secondary" onclick="editTask('${task.id}')">✏️ แก้ไข</button>
                <button class="btn btn-danger" onclick="deleteTask('${task.id}')">🗑️ ลบ</button>
            </div>
        `;
        taskListContainer.appendChild(taskItem);
    });
}

// --- 5. ฟังก์ชันจัดการข้อมูล (CRUD Operations) ---

// เพิ่มหรือแก้ไขข้อมูลงาน
function saveTask(e) {
    e.preventDefault(); // ป้องกันหน้าเว็บ Refresh ตัวเอง

    const id = taskIdInput.value;
    const taskData = {
        id: id || Date.now().toString(), // ถ้าเป็นงานใหม่จะสร้างรหัสจากเวลาปัจจุบัน
        title: taskTitleInput.value,
        subject: taskSubjectInput.value,
        dueDate: taskDueDateInput.value,
        priority: taskPrioritySelect.value,
        status: taskStatusSelect.value
    };

    if (id) {
        // กรณีแก้ไขข้อมูล: หาตำแหน่งเดิมแล้วแทนที่ข้อมูลใหม่
        const index = tasks.findIndex(t => t.id === id);
        tasks[index] = taskData;
    } else {
        // กรณีเพิ่มข้อมูลใหม่: เอาไปต่อท้ายอาร์เรย์
        tasks.push(taskData);
    }

    saveToLocalStorage(); // สั่งบันทึกข้อมูลลงคอมพิวเตอร์
    clearForm();          // ล้างข้อมูลในกล่องข้อความ
    renderApp();          // อัปเดตหน้าจอหลัก
}

// เตรียมข้อมูลขึ้นไปบนฟอร์มเพื่อเข้าสู่โหมดแก้ไขข้อมูล
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskSubjectInput.value = task.subject;
    taskDueDateInput.value = task.dueDate;
    taskPrioritySelect.value = task.priority;
    taskStatusSelect.value = task.status;

    // เปลี่ยนหน้าตาปุ่มและหัวข้อฟอร์ม
    formTitle.innerText = '✏️ แก้ไขข้อมูลงาน';
    saveBtn.innerText = '💾 บันทึกการแก้ไข';
    cancelEditBtn.classList.remove('hidden');
    
    // เลื่อนหน้าจอไปที่ฟอร์มด้านบนเพื่อให้ผู้ใช้รู้ว่ากำลังแก้ไข
    taskForm.scrollIntoView({ behavior: 'smooth' });
}

// ลบรายการงานเดี่ยวๆ
function deleteTask(id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveToLocalStorage();
        renderApp();
    }
}

// ลบงานที่ทำเสร็จแล้วออกทั้งหมด
function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    if (completedCount === 0) {
        alert('ไม่มีงานที่เสร็จแล้วให้ลบครับ');
        return;
    }
    if (confirm(`ต้องการลบงานที่เสร็จแล้วทั้งหมดจำนวน ${completedCount} งาน ใช่หรือไม่?`)) {
        tasks = tasks.filter(t => t.status !== 'completed');
        saveToLocalStorage();
        renderApp();
    }
}

// ล้างฟอร์มกลับเป็นค่าเริ่มต้น
function clearForm() {
    taskIdInput.value = '';
    taskForm.reset();
    formTitle.innerText = '➕ เพิ่มงานใหม่';
    saveBtn.innerText = '💾 บันทึกข้อมูล';
    cancelEditBtn.classList.add('hidden');
}

// --- 6. ฟังก์ชันจัดการแดชบอร์ด (Dashboard Logic) ---
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;

    // อัปเดตตัวเลขหลักบนบอร์ด
    document.getElementById('totalTasks').innerText = total;
    document.getElementById('pendingTasks').innerText = pending;
    document.getElementById('completedTasks').innerText = completed;

    // หางานเร่งด่วน (ยังไม่เสร็จ และ ส่งภายใน 3 วันนับจากวันนี้)
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

    // คำนวณจำนวนงานแยกตามรายวิชา
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

// --- 7. ฟังก์ชันจัดการ Local Storage & Theme ---
function saveToLocalStorage() {
    localStorage.setItem('my_tasks_data', JSON.stringify(tasks));
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('my_theme', newTheme);
}
