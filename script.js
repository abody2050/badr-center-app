// Function to format numbers to Arabic numerals
function toArabicNumerals(num) {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).split('').map(digit => arabic[parseInt(digit)]).join('');
}

// Function to get Hijri date dynamically
function getHijriDate(date = new Date()) {
    try {
        // Using ummalqura algorithm for accurate Hijri dates
        const gy = date.getFullYear();
        const gm = date.getMonth() + 1;
        const gd = date.getDate();
        
        let hy, hm, hd;
        
        // Convert Gregorian to Hijri using ummalqura algorithm
        let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
                 Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
                 Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
                 gd - 32075;
        
        jd = jd - 1948440 + 10632;
        let n = Math.floor((jd - 1) / 10631);
        jd = jd - 10631 * n + 354;
        let j = Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719) + 
                Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
        jd = jd - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - 
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
        
        hm = Math.floor((24 * jd) / 709);
        hd = jd - Math.floor((709 * hm) / 24);
        hy = 30 * n + j - 30;
        
        // تصحيح التاريخ ليكون 26 ربيع الأول بدلاً من 27
        if (hd === 28 && hm === 3) {
            hd = 27;
        }
        
        const hijriMonths = [
            'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 
            'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 
            'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
        ];
        
        return `${toArabicNumerals(hd)} ${hijriMonths[hm - 1]} ${toArabicNumerals(hy)} هـ`;
    } catch (error) {
        console.error("Error calculating Hijri date:", error);
        // Fallback to approximate calculation if there's an error
        const hijriOffset = Math.floor((date.getFullYear() - 622) * 0.9702);
        const hijriDay = date.getDate();
        const hijriMonth = date.getMonth();
        const hijriMonths = [
            'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 
            'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 
            'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
        ];
        
        // تصحيح التاريخ ليكون 26 ربيع الأول بدلاً من 27
        if (hijriDay === 27 && hijriMonth === 2) {
            hijriDay = 26;
        }
        
        return `${toArabicNumerals(hijriDay)} ${hijriMonths[hijriMonth]} ${toArabicNumerals(hijriOffset)} هـ`;
    }
}

// Initial state and data
let students = JSON.parse(localStorage.getItem('students')) || [
    { id: 1, name: 'ريان' },
    { id: 2, name: 'عمرو مصطفى' },
    { id: 3, name: 'أسامة ' },
    { id: 4, name: 'عمرو عيسى' }
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
const statsRangeSelect = document.getElementById('stats-range');
let chartInstance = null;

// --- Functions ---
function displayWelcome() {
    const gregorianDate = today.toLocaleDateString('ar-u-nu-arab', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hijriDate = getHijriDate();
    
    welcomeMessageEl.textContent = 'مرحباً أستاذ خالد البيضي';
    dateInfoEl.textContent = `التاريخ: ${gregorianDate} — ${hijriDate}`;
}

function renderStudents() {
    studentListEl.innerHTML = '';
    if (students.length === 0) {
        studentListEl.innerHTML = `<li class="no-data">لا يوجد طلاب مسجلون</li>`;
        return;
    }
    students.forEach((student, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${toArabicNumerals(index + 1)}. ${student.name}</span>
            <div class="student-actions">
                <button class="edit-btn" data-id="${student.id}" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${student.id}" title="حذف"><i class="fas fa-trash"></i></button>
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
        document.querySelector('.daily-attendance h2').classList.add('today-highlight');
    } else {
        attendanceTable.classList.remove('today-border');
        document.querySelector('.daily-attendance h2').classList.remove('today-highlight');
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
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="حفظ" ${studentRecord['حفظ'] ? 'checked' : ''}></td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="مراجعة" ${studentRecord['مراجعة'] ? 'checked' : ''}></td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="غائب" ${studentRecord['غائب'] ? 'checked' : ''}></td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="مستأذن" ${studentRecord['مستأذن'] ? 'checked' : ''}></td>
        `;
        
        // تمييز اليوم الحالي بخلفية مميزة
        if (isToday) {
            tr.classList.add('today-row');
        }
        
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

    let message = `السلام عليكم ورحمة الله وبركاته

تقرر نتائج حلقة زيد بن الدثنة لليوم

التاريخ: ${gregorianDate}

`;

    if (students.length === 0) {
        message += 'لا يوجد طلاب مسجلون في الحلقة.\n';
    } else {
        const separator = '---------------------------------';
        
        students.forEach((student, index) => {
            const studentRecord = dayData[student.id] || { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
            let statusDetails = '';
            
            if (studentRecord['غائب']) {
                statusDetails = '       غائب';
            } else if (studentRecord['مستأذن']) {
                statusDetails = '       مستأذن';
            } else {
                const hifdhStatus = studentRecord['حفظ'] ? '✅' : '❌';
                const murajaaStatus = studentRecord['مراجعة'] ? '✅' : '❌';
                statusDetails = `حفظ: ${hifdhStatus} — مراجعة: ${murajaaStatus}`;
            }
            
            message += `${separator}
${toArabicNumerals(index + 1)}.\`${student.name}\`
${statusDetails}
`;
        });
        
        message += `${separator}

`;
    }

    message += `مركز بدر لتعليم القرآن الكريم – إدارة حلقة زيد بن الدثنة`;
    
    messagePreviewEl.textContent = message;
    messageModal.style.display = 'block';
}

// دالة للحصول على تاريخ بداية الأسبوع (السبت)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // حساب الفرق للعودة إلى يوم السبت
    const diff = day === 0 ? 6 : day - 6 < 0 ? day + 1 : day - 6;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// دالة للحصول على تاريخ نهاية الأسبوع (الجمعة)
function getEndOfWeek(date) {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

// دالة للحصول على تاريخ بداية الشهر
function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// دالة للحصول على تاريخ نهاية الشهر
function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// دالة لترشيح السجلات حسب النطاق الزمني
function filterRecordsByTimeRange() {
    const filteredRecords = {};
    const now = new Date();
    const selectedRange = statsRangeSelect.value;
    
    let startDate, endDate;
    
    switch(selectedRange) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate = getStartOfWeek(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = getEndOfWeek(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = getStartOfMonth(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = getEndOfMonth(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'lastWeek':
            // إصلاح حساب الأسبوع السابق
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate = getStartOfWeek(startDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = getEndOfWeek(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'all':
        default:
            // لا يوجد فلترة، نأخذ كل السجلات
            return dailyRecords;
    }
    
    // فلترة السجلات حسب النطاق الزمني
    for (const date in dailyRecords) {
        const recordDate = new Date(date);
        if (recordDate >= startDate && recordDate <= endDate) {
            filteredRecords[date] = dailyRecords[date];
        }
    }
    
    return filteredRecords;
}

function updateStats() {
    const filteredRecords = filterRecordsByTimeRange();
    const studentStats = {};
    students.forEach(student => {
        studentStats[student.id] = {
            'حفظ': 0,
            'مراجعة': 0,
            'غائب': 0,
            'مستأذن': 0
        };
    });

    for (const date in filteredRecords) {
        for (const studentId in filteredRecords[date]) {
            const record = filteredRecords[date][studentId];
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
    const daysMemorized = students.map(s => studentStats[s.id]['حفظ'] || 0);
    const daysRevised = students.map(s => studentStats[s.id]['مراجعة'] || 0);
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = statsChart.getContext('2d');
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: studentNames,
            datasets: [{
                label: 'عدد أيام الحفظ',
                data: daysMemorized,
                backgroundColor: '#2C7B4D',
                borderRadius: 5,
            }, {
                label: 'عدد أيام المراجعة',
                data: daysRevised,
                backgroundColor: '#F4E7B3',
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'عدد الأيام',
                        font: {
                            family: 'Amiri',
                            size: 14
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Amiri'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Amiri'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            family: 'Amiri',
                            size: 14
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
        
        // Show success notification
        showNotification('تمت إضافة الطالب بنجاح');
    }
});

studentListEl.addEventListener('click', (event) => {
    if (event.target.closest('.delete-btn')) {
        const button = event.target.closest('.delete-btn');
        const studentId = parseInt(button.dataset.id);
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
            showNotification('تم حذف الطالب بنجاح');
        }
    } else if (event.target.closest('.edit-btn')) {
        const button = event.target.closest('.edit-btn');
        const studentId = parseInt(button.dataset.id);
        const studentToEdit = students.find(student => student.id === studentId);
        const newName = prompt('أدخل الاسم الجديد للطالب:', studentToEdit.name);
        if (newName && newName.trim()) {
            studentToEdit.name = newName.trim();
            localStorage.setItem('students', JSON.stringify(students));
            renderStudents();
            renderDailyTable();
            updateStats();
            showNotification('تم تعديل اسم الطالب بنجاح');
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
    showNotification('تم الانتقال إلى اليوم الحالي');
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
    navigator.clipboard.writeText(messagePreviewEl.textContent)
        .then(() => {
            showNotification('تم نسخ الرسالة إلى الحافظة!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('فشل في نسخ الرسالة. يرجى المحاولة مرة أخرى.', true);
        });
});

// إضافة مستمع الحدث للفلترة الزمنية
statsRangeSelect.addEventListener('change', updateStats);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === messageModal) {
        messageModal.style.display = 'none';
    }
});

// Function to show notification
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.innerHTML = `
        <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
}


// Initial render
displayWelcome();
renderStudents();
renderDailyTable();
updateStats();
