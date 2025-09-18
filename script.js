// Function to format numbers to Arabic numerals
function toArabicNumerals(num) {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).split('').map(digit => arabic[parseInt(digit)]).join('');
}

// Function to get Hijri date (fixed)
function getHijriDate() {
    const hijriDate = {
        day: 26,
        month: 'ربيع الأول',
        year: '1447'
    };
    return `${toArabicNumerals(hijriDate.day)} ${hijriDate.month} ${hijriDate.year} هـ`;
}

// Initial state and data
let students = JSON.parse(localStorage.getItem('students')) || [
    { id: 1, name: 'محمد أحمد' },
    { id: 2, name: 'عائشة خالد' },
    { id: 3, name: 'علي حسن' },
    { id: 4, name: 'سارة محمود' }
];
let dailyRecords = JSON.parse(localStorage.getItem('dailyRecords')) || {};
let currentDay = new Date();
const today = new Date();

// DOM Elements
const welcomeMessageEl = document.getElementById('welcome-message');
const dateInfoEl = document.getElementById('date-info');
const currentDayDateEl = document.getElementById('current-day-date');
const studentListEl = document.getElementById('student-list');
const attendanceBodyEl = document.getElementById('attendance-body');
const generateMessageBtn = document.getElementById('generate-message-btn');
const messageModal = document.getElementById('message-modal');
const messagePreviewEl = document.getElementById('message-preview');
const copyMessageBtn = document.getElementById('copy-message-btn');
const closeBtn = document.querySelector('.close-btn');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const statsChart = document.getElementById('stats-chart');
const studentStatsDetailsEl = document.getElementById('student-stats-details');
const goToTodayBtn = document.getElementById('go-to-today-btn');
const dateInput = document.getElementById('date-input');
const attendanceTable = document.getElementById('attendance-table');
let chartInstance = null;

// --- Functions ---
function displayWelcome() {
    const gregorianDate = today.toLocaleDateString('ar-u-nu-arab', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hijriDate = getHijriDate();
    
    welcomeMessageEl.textContent = 'مرحباً يا أستاذ خالد البيضي';
    dateInfoEl.textContent = `التاريخ: ${gregorianDate} — ${hijriDate}`;
}

function renderStudents() {
    studentListEl.innerHTML = '';
    if (students.length === 0) {
        studentListEl.innerHTML = `<li>لا يوجد طلاب مسجلون</li>`;
        return;
    }
    students.forEach((student, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${toArabicNumerals(index + 1)}. ${student.name}</span>
            <div class="student-actions">
                <button class="edit-btn" data-id="${student.id}">✏️</button>
                <button class="delete-btn" data-id="${student.id}">🗑️</button>
            </div>
        `;
        studentListEl.appendChild(li);
    });
    localStorage.setItem('students', JSON.stringify(students));
}

function renderDailyTable() {
    attendanceBodyEl.innerHTML = '';
    const dateKey = currentDay.toISOString().slice(0, 10);
    const dayData = dailyRecords[dateKey] || {};

    const gregorianDate = currentDay.toLocaleDateString('ar-u-nu-arab', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    currentDayDateEl.textContent = gregorianDate;

    const isToday = currentDay.getDate() === today.getDate() &&
                    currentDay.getMonth() === today.getMonth() &&
                    currentDay.getFullYear() === today.getFullYear();

    if (isToday) {
        attendanceTable.classList.add('today-border');
    } else {
        attendanceTable.classList.remove('today-border');
    }

    dateInput.value = currentDay.toISOString().slice(0, 10);

    if (students.length === 0) {
        attendanceBodyEl.innerHTML = `<tr><td colspan="6" style="text-align:center;">لا يوجد طلاب مسجلون</td></tr>`;
        return;
    }
    
    students.forEach((student, index) => {
        const studentRecord = dayData[student.id] || { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${toArabicNumerals(index + 1)}</td>
            <td>${student.name}</td>
            <td><input type="checkbox" data-student-id="${student.id}" data-status="حفظ" ${studentRecord['حفظ'] ? 'checked' : ''}></td>
            <td><input type="checkbox" data-student-id="${student.id}" data-status="مراجعة" ${studentRecord['مراجعة'] ? 'checked' : ''}></td>
            <td><input type="checkbox" data-student-id="${student.id}" data-status="غائب" ${studentRecord['غائب'] ? 'checked' : ''}></td>
            <td><input type="checkbox" data-student-id="${student.id}" data-status="مستأذن" ${studentRecord['مستأذن'] ? 'checked' : ''}></td>
        `;
        attendanceBodyEl.appendChild(tr);
    });
}

function handleStatusChange(event) {
    const checkbox = event.target;
    const studentId = parseInt(checkbox.dataset.studentId);
    const status = checkbox.dataset.status;
    const dateKey = currentDay.toISOString().slice(0, 10);

    if (!dailyRecords[dateKey]) {
        dailyRecords[dateKey] = {};
    }
    if (!dailyRecords[dateKey][studentId]) {
        dailyRecords[dateKey][studentId] = { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
    }

    if (status === 'غائب' || status === 'مستأذن') {
        const allCheckboxes = document.querySelectorAll(`input[data-student-id="${studentId}"]`);
        allCheckboxes.forEach(cb => {
            if (cb.dataset.status !== status) {
                cb.checked = false;
            }
        });
        dailyRecords[dateKey][studentId] = { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
        dailyRecords[dateKey][studentId][status] = checkbox.checked;
    } else {
        const absentCheckbox = document.querySelector(`input[data-student-id="${studentId}"][data-status="غائب"]`);
        const excusedCheckbox = document.querySelector(`input[data-student-id="${studentId}"][data-status="مستأذن"]`);
        if (absentCheckbox) absentCheckbox.checked = false;
        if (excusedCheckbox) excusedCheckbox.checked = false;
        dailyRecords[dateKey][studentId]['غائب'] = false;
        dailyRecords[dateKey][studentId]['مستأذن'] = false;
        dailyRecords[dateKey][studentId][status] = checkbox.checked;
    }
    
    localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
    updateStats();
}

function generateMessage() {
    const dateKey = currentDay.toISOString().slice(0, 10);
    const dayData = dailyRecords[dateKey] || {};
    const today = currentDay;
    const gregorianDate = today.toLocaleDateString('ar-u-nu-arab', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hijriDate = getHijriDate();

    let message = `السلام عليكم ورحمة الله وبركاته
تقرر نتائج حلقة زيد بن الدثنة لليوم
التاريخ: ${gregorianDate} — ${hijriDate}
\n`;

    if (students.length === 0) {
        message += 'لا يوجد طلاب مسجلون في الحلقة.\n';
    } else {
        students.forEach((student, index) => {
            const studentRecord = dayData[student.id] || { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
            let statusDetails = '';
            
            if (studentRecord['غائب']) {
                statusDetails = 'غائب';
            } else if (studentRecord['مستأذن']) {
                statusDetails = 'مستأذن';
            } else {
                const hifdhStatus = studentRecord['حفظ'] ? '✅' : '❌';
                const murajaaStatus = studentRecord['مراجعة'] ? '✅' : '❌';
                statusDetails = `حفظ: ${hifdhStatus} — مراجعة: ${murajaaStatus}`;
            }
            
            message += `${toArabicNumerals(index + 1)}. ${student.name} — ${statusDetails}\n`;
        });
    }

    message += `\nمركز بدر لتعليم القرآن الكريم – إدارة حلقة زيد بن الدثنة`;
    
    messagePreviewEl.textContent = message;
    messageModal.style.display = 'block';
}

function updateStats() {
    const studentStats = {};
    students.forEach(student => {
        studentStats[student.id] = {
            'حفظ': 0,
            'مراجعة': 0,
            'غائب': 0,
            'مستأذن': 0
        };
    });

    for (const date in dailyRecords) {
        for (const studentId in dailyRecords[date]) {
            const record = dailyRecords[date][studentId];
            if (studentStats[studentId]) { // Ensure student exists
                if (record['حفظ']) studentStats[studentId]['حفظ']++;
                if (record['مراجعة']) studentStats[studentId]['مراجعة']++;
                if (record['غائب']) studentStats[studentId]['غائب']++;
                if (record['مستأذن']) studentStats[studentId]['مستأذن']++;
            }
        }
    }

    renderChart(studentStats);
    renderIndividualStats(studentStats);
}

function renderChart(studentStats) {
    const studentNames = students.map(s => s.name);
    const daysMemorized = students.map(s => studentStats[s.id]['حفظ']);
    const daysRevised = students.map(s => studentStats[s.id]['مراجعة']);
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(statsChart, {
        type: 'bar',
        data: {
            labels: studentNames,
            datasets: [{
                label: 'عدد أيام الحفظ',
                data: daysMemorized,
                backgroundColor: '#2C7B4D'
            }, {
                label: 'عدد أيام المراجعة',
                data: daysRevised,
                backgroundColor: '#F4E7B3'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'عدد الأيام'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            family: 'Amiri'
                        }
                    }
                }
            }
        }
    });
}

function renderIndividualStats(studentStats) {
    studentStatsDetailsEl.innerHTML = '';
    
    if (students.length === 0) {
        studentStatsDetailsEl.innerHTML = '<p style="text-align:center; color:#555;">لا توجد بيانات إحصائية لعرضها.</p>';
        return;
    }
    
    students.forEach(student => {
        const stats = studentStats[student.id] || { حفظ: 0, مراجعة: 0, غائب: 0, مستأذن: 0 };
        const card = document.createElement('div');
        card.className = 'student-stat-card';
        card.innerHTML = `
            <h3>${student.name}</h3>
            <div class="stat-item">
                <span class="stat-label">أيام الحفظ:</span>
                <span class="stat-value">${toArabicNumerals(stats['حفظ'])}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أيام المراجعة:</span>
                <span class="stat-value">${toArabicNumerals(stats['مراجعة'])}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أيام الغياب:</span>
                <span class="stat-value">${toArabicNumerals(stats['غائب'])}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أيام الاستئذان:</span>
                <span class="stat-value">${toArabicNumerals(stats['مستأذن'])}</span>
            </div>
        `;
        studentStatsDetailsEl.appendChild(card);
    });
}

// --- Event Listeners ---
document.getElementById('add-student-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('student-name');
    const newName = nameInput.value.trim();
    if (newName) {
        students.push({ id: Date.now(), name: newName });
        nameInput.value = '';
        renderStudents();
        renderDailyTable();
        updateStats();
    }
});

studentListEl.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const studentId = parseInt(event.target.dataset.id);
        if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            students = students.filter(student => student.id !== studentId);
            for (const date in dailyRecords) {
                if (dailyRecords[date][studentId]) {
                    delete dailyRecords[date][studentId];
                }
            }
            localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
            renderStudents();
            renderDailyTable();
            updateStats();
        }
    } else if (event.target.classList.contains('edit-btn')) {
        const studentId = parseInt(event.target.dataset.id);
        const studentToEdit = students.find(student => student.id === studentId);
        const newName = prompt('أدخل الاسم الجديد للطالب:', studentToEdit.name);
        if (newName && newName.trim()) {
            studentToEdit.name = newName.trim();
            localStorage.setItem('students', JSON.stringify(students));
            renderStudents();
            renderDailyTable();
            updateStats(); // <--- Added this line
        }
    }
});

prevDayBtn.addEventListener('click', () => {
    currentDay.setDate(currentDay.getDate() - 1);
    renderDailyTable();
});

nextDayBtn.addEventListener('click', () => {
    currentDay.setDate(currentDay.getDate() + 1);
    renderDailyTable();
});

goToTodayBtn.addEventListener('click', () => {
    currentDay = new Date();
    renderDailyTable();
});

dateInput.addEventListener('change', (event) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
        currentDay = newDate;
        renderDailyTable();
    }
});

attendanceBodyEl.addEventListener('change', handleStatusChange);
generateMessageBtn.addEventListener('click', generateMessage);
closeBtn.addEventListener('click', () => messageModal.style.display = 'none');
copyMessageBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(messagePreviewEl.textContent);
    alert('تم نسخ الرسالة!');
});

// Initial render
displayWelcome();
renderStudents();
renderDailyTable();
updateStats();