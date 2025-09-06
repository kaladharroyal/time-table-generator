// Timetable Generator JavaScript

// Global State
let currentView = 'admin';
let selectedBranch = '';
let selectedSection = '';
let subjects = [];
let generatedTimetable = [];

let facultyList = [];
// Load facultyList from localStorage if available
if (localStorage.getItem('facultyList')) {
    try {
        facultyList = JSON.parse(localStorage.getItem('facultyList'));
    } catch (e) {
        facultyList = [];
    }
}
if (!facultyList.length) {
    facultyList = [
        'Dr. Smith Johnson', 'Prof. Sarah Wilson', 'Dr. Michael Brown', 
        'Prof. Emily Davis', 'Dr. James Miller', 'Prof. Lisa Anderson',
        'Dr. Robert Taylor', 'Prof. Jennifer Martinez'
    ];
}

const defaultSubjects = [
    { id: '1', name: 'Data Structures', type: 'theory', hours: 4, faculty: '' },
    { id: '2', name: 'Database Management', type: 'theory', hours: 3, faculty: '' },
    { id: '3', name: 'Operating Systems', type: 'theory', hours: 3, faculty: '' },
    { id: '4', name: 'Computer Networks', type: 'theory', hours: 3, faculty: '' },
    { id: '5', name: 'DS Lab', type: 'lab', hours: 2, faculty: '' },
    { id: '6', name: 'DBMS Lab', type: 'lab', hours: 2, faculty: '' },
    { id: '7', name: 'OS Lab', type: 'lab', hours: 2, faculty: '' }
];

const timeSlots = {
    'P1': '9:00-9:50',
    'P2': '9:50-10:40',
    'Break': '10:40-11:00',
    'P3': '11:00-11:50',
    'P4': '11:50-12:40',
    'Lunch': '12:40-1:40',
    'P5': '1:40-2:30',
    'P6': '2:30-3:20',
    'P7': '3:20-4:10'
};

// DOM Elements
const adminBtn = document.getElementById('adminBtn');
const timetableBtn = document.getElementById('timetableBtn');
const adminView = document.getElementById('adminView');
const timetableView = document.getElementById('timetableView');
const branchSelect = document.getElementById('branchSelect');
const sectionSelect = document.getElementById('sectionSelect');
const selectionDisplay = document.getElementById('selectionDisplay');
const loadDefaultBtn = document.getElementById('loadDefaultBtn');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const subjectsContainer = document.getElementById('subjectsContainer');
const subjectsList = document.getElementById('subjectsList');
const noSubjects = document.getElementById('noSubjects');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    setupEventListeners();
    updateGenerateButton();
    populateFacultyDropdown();
    document.getElementById('facultyBtn').addEventListener('click', () => switchView('faculty'));
    document.getElementById('facultySelect').addEventListener('change', handleFacultySelect);

    // Add Faculty form
    const addFacultyForm = document.getElementById('addFacultyForm');
    if (addFacultyForm) {
        addFacultyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById('facultyNameInput');
            const msg = document.getElementById('addFacultyMsg');
            const name = input.value.trim();
            if (name && !facultyList.includes(name)) {
                facultyList.push(name);
                input.value = '';
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 1500);
                updateAllFacultyDropdowns();
            } else if (facultyList.includes(name)) {
                msg.textContent = 'Faculty already exists!';
                msg.classList.remove('hidden');
                setTimeout(() => {
                    msg.classList.add('hidden');
                    msg.textContent = 'Faculty added!';
                }, 1500);
            }
        });
    }
});
// Update all faculty dropdowns (subjects and faculty view)
function updateAllFacultyDropdowns() {
    // Save facultyList to localStorage
    localStorage.setItem('facultyList', JSON.stringify(facultyList));
    // Update subject faculty selects
    subjects.forEach(subject => {
        const facultySelect = document.getElementById(`faculty-${subject.id}`);
        if (facultySelect) {
            const current = facultySelect.value;
            facultySelect.innerHTML = '<option value="">Select faculty</option>' + facultyList.map(faculty => `<option value="${faculty}" ${current === faculty ? 'selected' : ''}>${faculty}</option>`).join('');
        }
    });
    // Update faculty view dropdown
    const facultySelect = document.getElementById('facultySelect');
    if (facultySelect) {
        const current = facultySelect.value;
        // Remove all except the first option
        while (facultySelect.options.length > 1) facultySelect.remove(1);
        facultyList.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty;
            option.textContent = faculty;
            if (current === faculty) option.selected = true;
            facultySelect.appendChild(option);
        });
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    adminBtn.addEventListener('click', () => switchView('admin'));
    timetableBtn.addEventListener('click', () => switchView('timetable'));

    // Branch and Section
    branchSelect.addEventListener('change', handleBranchChange);
    sectionSelect.addEventListener('change', handleSectionChange);

    // Subject Management
    loadDefaultBtn.addEventListener('click', loadDefaultSubjects);
    addSubjectBtn.addEventListener('click', addSubject);
    generateBtn.addEventListener('click', generateTimetable);

    // Download
    downloadBtn.addEventListener('click', downloadTimetable);
}

// Navigation
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view').forEach(viewElement => viewElement.classList.remove('active'));
    if (view === 'admin') {
        adminBtn.classList.add('active');
        adminView.classList.add('active');
    } else if (view === 'timetable') {
        timetableBtn.classList.add('active');
        timetableView.classList.add('active');
    } else if (view === 'faculty') {
        document.getElementById('facultyBtn').classList.add('active');
        document.getElementById('facultyView').classList.add('active');
        populateFacultyDropdown();
        showNoFacultySelected();
    }
}
// Faculty View Logic
function populateFacultyDropdown() {
    const facultySelect = document.getElementById('facultySelect');
    if (!facultySelect) return;
    // Only add options if not already present (avoid duplicates)
    if (facultySelect.options.length > 1) return;
    facultyList.forEach(faculty => {
        const option = document.createElement('option');
        option.value = faculty;
        option.textContent = faculty;
        facultySelect.appendChild(option);
    });
}

function handleFacultySelect() {
    const faculty = document.getElementById('facultySelect').value;
    if (!faculty) {
        showNoFacultySelected();
        return;
    }
    showFacultyDetails(faculty);
}

function showNoFacultySelected() {
    document.getElementById('facultyDetails').classList.add('hidden');
    document.getElementById('noFacultySelected').classList.remove('hidden');
}

function showFacultyDetails(faculty) {
    const details = document.getElementById('facultyDetails');
    const noSelected = document.getElementById('noFacultySelected');
    details.classList.remove('hidden');
    noSelected.classList.add('hidden');

    // Gather all slots for this faculty
    const slots = generatedTimetable.filter(slot => slot.faculty === faculty);
    // Stats
    document.getElementById('facultyTotalPeriods').textContent = slots.length;
    document.getElementById('facultyTheoryCount').textContent = slots.filter(s => s.type === 'theory').length;
    document.getElementById('facultyLabCount').textContent = slots.filter(s => s.type === 'lab').length;
    // Subjects taught
    const subjectsTaught = Array.from(new Set(slots.map(s => s.subject)));
    document.getElementById('facultySubjectCount').textContent = subjectsTaught.length;
    // Subjects list
    document.getElementById('facultySubjectsList').innerHTML = subjectsTaught.map(sub => `<div class="p-2 bg-secondary rounded">${sub}</div>`).join('');

    // Weekly schedule grid
    renderFacultyScheduleGrid(faculty, slots);
}

function renderFacultyScheduleGrid(faculty, slots) {
    const grid = document.getElementById('facultyScheduleGrid');
    if (!grid) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7'];
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `minmax(120px, 1fr) repeat(${periods.length}, minmax(100px, 1fr))`;
    // Header row
    let headerHtml = `<div class="timetable-header">Day / Time</div>`;
    periods.forEach(period => {
        headerHtml += `<div class="timetable-header text-sm">
            <div class="font-semibold">${period}</div>
            <div class="text-xs opacity-90">${timeSlots[period] || ''}</div>
        </div>`;
    });
    grid.innerHTML += headerHtml;
    // Rows for each day
    days.forEach(day => {
        let rowHtml = `<div class="timetable-header">${day}</div>`;
        periods.forEach(period => {
            const slot = slots.find(s => s.day === day && s.period === period);
            let cellClass = 'timetable-cell';
            let cellContent = '';
            if (period === 'Break') cellClass += ' period-break';
            if (period === 'Lunch') cellClass += ' period-lunch';
            if (slot) {
                cellClass += slot.type === 'lab' ? ' subject-lab' : (slot.type === 'theory' ? ' subject-theory' : '');
                cellContent = `<div class="font-medium text-sm">${slot.subject}</div>`;
            }
            rowHtml += `<div class="${cellClass}">${cellContent}</div>`;
        });
        grid.innerHTML += rowHtml;
    });
    setTimeout(() => lucide.createIcons(), 0);
}

// Branch and Section Handlers
function handleBranchChange() {
    selectedBranch = branchSelect.value;
    updateSelectionDisplay();
    updateGenerateButton();
}

function handleSectionChange() {
    selectedSection = sectionSelect.value;
    updateSelectionDisplay();
    updateGenerateButton();
}

function updateSelectionDisplay() {
    const display = selectionDisplay;
    if (selectedBranch && selectedSection) {
        display.classList.remove('hidden');
        display.querySelector('p').textContent = `Selected: ${selectedBranch} - Section ${selectedSection}`;
    } else {
        display.classList.add('hidden');
    }
}

// Subject Management
function loadDefaultSubjects() {
    subjects = JSON.parse(JSON.stringify(defaultSubjects)); // Deep copy to avoid modifying original array
    renderSubjects();
    updateGenerateButton();
}

function addSubject() {
    const newSubject = {
        id: Date.now().toString(),
        name: 'New Subject',
        type: 'theory',
        hours: 3,
        faculty: ''
    };
    subjects.push(newSubject);
    renderSubjects();
    updateGenerateButton();
}

function updateSubject(id, updates) {
    const index = subjects.findIndex(sub => sub.id === id);
    if (index !== -1) {
        subjects[index] = { ...subjects[index], ...updates };
        updateGenerateButton();
    }
}

function removeSubject(id) {
    subjects = subjects.filter(sub => sub.id !== id);
    renderSubjects();
    updateGenerateButton();
}

function renderSubjects() {
    if (subjects.length === 0) {
        noSubjects.classList.remove('hidden');
        subjectsList.classList.add('hidden');
    } else {
        noSubjects.classList.add('hidden');
        subjectsList.classList.remove('hidden');
        subjectsList.innerHTML = subjects.map(subject => createSubjectHTML(subject)).join('');
        
        // Add event listeners to newly created elements
        subjects.forEach(subject => {
            const nameInput = document.getElementById(`name-${subject.id}`);
            const typeSelect = document.getElementById(`type-${subject.id}`);
            const hoursInput = document.getElementById(`hours-${subject.id}`);
            const facultySelect = document.getElementById(`faculty-${subject.id}`);
            const removeBtn = document.getElementById(`remove-${subject.id}`);

            nameInput.addEventListener('input', (e) => updateSubject(subject.id, { name: e.target.value }));
            typeSelect.addEventListener('change', (e) => updateSubject(subject.id, { type: e.target.value }));
            hoursInput.addEventListener('input', (e) => updateSubject(subject.id, { hours: parseInt(e.target.value) || 1 }));
            facultySelect.addEventListener('change', (e) => updateSubject(subject.id, { faculty: e.target.value }));
            removeBtn.addEventListener('click', () => removeSubject(subject.id));
        });
    }
}

function createSubjectHTML(subject) {
    return `
        <div class="form-section">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="space-y-1">
                    <label>Subject Name</label>
                    <input id="name-${subject.id}" type="text" class="custom-input" value="${subject.name}" placeholder="Enter subject name">
                </div>
                <div class="space-y-1">
                    <label>Type</label>
                    <select id="type-${subject.id}" class="custom-select">
                        <option value="theory" ${subject.type === 'theory' ? 'selected' : ''}>Theory</option>
                        <option value="lab" ${subject.type === 'lab' ? 'selected' : ''}>Laboratory</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label>Hours/Week</label>
                    <input id="hours-${subject.id}" type="number" min="1" max="8" class="custom-input" value="${subject.hours}">
                </div>
                <div class="space-y-1">
                    <label>Assigned Faculty</label>
                    <select id="faculty-${subject.id}" class="custom-select">
                        <option value="">Select faculty</option>
                        ${facultyList.map(faculty => 
                            `<option value="${faculty}" ${subject.faculty === faculty ? 'selected' : ''}>${faculty}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="flex items-center justify-between mt-3">
                <div class="flex items-center space-x-2">
                    <span class="badge ${subject.type === 'lab' ? 'badge-secondary' : 'badge-default'}">
                        ${subject.type === 'lab' ? 'Laboratory' : 'Theory'}
                    </span>
                    <span class="badge badge-outline">${subject.hours}h/week</span>
                </div>
                <button id="remove-${subject.id}" class="btn btn-destructive btn-sm">
                    Remove
                </button>
            </div>
        </div>
    `;
}

function updateGenerateButton() {
    // Debug output
    console.log('updateGenerateButton called');
    console.log('selectedBranch:', selectedBranch);
    console.log('selectedSection:', selectedSection);
    console.log('subjects:', subjects);
    const missingFaculty = subjects.filter(sub => !sub.faculty);
    const missingName = subjects.filter(sub => !sub.name);
    console.log('missingFaculty:', missingFaculty);
    console.log('missingName:', missingName);
    const canGenerate = selectedBranch && selectedSection && subjects.length > 0 && subjects.every(sub => sub.faculty && sub.name);
    console.log('canGenerate:', canGenerate);
    generateBtn.disabled = !canGenerate;
    timetableBtn.disabled = generatedTimetable.length === 0;
    const helpText = document.getElementById('generateHelp');
    if (canGenerate) {
        helpText.classList.add('hidden');
    } else {
        helpText.classList.remove('hidden');
    }
}

// Timetable Generation
function generateTimetable() {
    if (!selectedBranch || !selectedSection || subjects.length === 0) {
        return;
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7'];

    const timetableMap = {};
    days.forEach(day => {
        timetableMap[day] = {};
        periods.forEach(period => {
            if (period === 'Break') {
                timetableMap[day][period] = {
                    day,
                    period: 'Break',
                    subject: 'Break',
                    faculty: '',
                    type: 'break'
                };
            } else if (period === 'Lunch') {
                timetableMap[day][period] = {
                    day,
                    period: 'Lunch',
                    subject: 'Lunch Break',
                    faculty: '',
                    type: 'lunch'
                };
            } else {
                timetableMap[day][period] = null;
            }
        });
    });

    const shuffledSubjects = [...subjects].sort(() => 0.5 - Math.random());
    const subjectHours = shuffledSubjects.map(s => ({ ...s, hoursLeft: s.hours }));

    // Place labs first as continuous blocks
    const labs = subjectHours.filter(s => s.type === 'lab');
    const daysWithLabs = new Set();
    
    labs.forEach(lab => {
        let placed = false;
        // Try to find a day that does not already have a lab
        for (const day of days) {
            if (!daysWithLabs.has(day)) {
                const periodsInDay = periods.filter(p => p !== 'Break' && p !== 'Lunch');
                const slots = findContinuousSlots(timetableMap, day, periods, lab.hours);
                if (slots) {
                    slots.forEach(period => {
                        timetableMap[day][period] = createSlot(day, period, lab, 'Lab-101');
                    });
                    placed = true;
                    daysWithLabs.add(day);
                    break;
                }
            }
        }
    });

    // Place remaining theory subjects in any available slots
    const theories = subjectHours.filter(s => s.type !== 'lab');
    let theoryIndex = 0;
    days.forEach(day => {
        periods.forEach(period => {
            if (!timetableMap[day][period]) {
                const availableTheories = theories.filter(t => t.hoursLeft > 0);
                if (availableTheories.length > 0) {
                    const theory = availableTheories[theoryIndex % availableTheories.length];
                    timetableMap[day][period] = createSlot(day, period, theory, 'Room-205');
                    theory.hoursLeft--;
                    theoryIndex++;
                }
            }
        });
    });

    // Flatten timetableMap to generatedTimetable
    generatedTimetable = Object.values(timetableMap).flatMap(day => Object.values(day).filter(slot => slot));
    
    renderTimetable();
    updateGenerateButton();
    switchView('timetable');
}

// Helper functions for timetable generation
function findContinuousSlots(map, day, periods, needed) {
    const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
    for (let i = 0; i <= validPeriods.length - needed; i++) {
        const potentialSlots = validPeriods.slice(i, i + needed);
        if (potentialSlots.every(p => !map[day][p])) {
            return potentialSlots;
        }
    }
    return null;
}

function findSingleSlot(map, day, periods) {
    const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
    for (const period of validPeriods) {
        if (!map[day][period]) {
            return period;
        }
    }
    return null;
}

function createSlot(day, period, subject, classroom) {
    return {
        day,
        period,
        subject: subject.name,
        faculty: subject.faculty,
        type: subject.type,
        classroom
    };
}


function renderTimetable() {
    const grid = document.getElementById('timetableGrid');
    const subtitle = document.getElementById('timetableSubtitle');
    const facultyListContainer = document.getElementById('facultyListContainer');

    subtitle.textContent = `${selectedBranch} - Section ${selectedSection}`;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday'];
    const periods = ['P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7'];
    
    // Clear grid and prepare for new structure
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `minmax(120px, 1fr) repeat(${periods.length}, minmax(100px, 1fr))`;

    // Header row (Days and Periods)
    let headerHtml = `<div class="timetable-header">Day / Time</div>`;
    periods.forEach(period => {
        headerHtml += `<div class="timetable-header text-sm">
            <div class="font-semibold">${period}</div>
            <div class="text-xs opacity-90">${timeSlots[period] || ''}</div>
        </div>`;
    });
    grid.innerHTML += headerHtml;
    
    // Rows for each day
    days.forEach(day => {
        // First cell is the Day name
        let rowHtml = `<div class="timetable-header">${day}</div>`;
        
        // Loop through each period for the current day
        periods.forEach(period => {
            const slot = generatedTimetable.find(s => s.day === day && s.period === period);
            const cellClass = slot ? getCellClass(slot.type) : 'timetable-cell';
            
            let cellContent = '';
            if (slot) {
                cellContent = `
                    <div class="font-medium text-sm">${slot.subject}</div>
                    ${slot.classroom ? `<div class="text-xs text-muted-foreground flex items-center">
                        <i data-lucide="map-pin" class="h-3 w-3 mr-1"></i>${slot.classroom}
                    </div>` : ''}
                    ${(slot.type === 'theory' || slot.type === 'lab') ? `
                        <span class="badge ${slot.type === 'lab' ? 'badge-secondary' : 'badge-default'} mt-1" style="font-size: 0.625rem;">
                            ${slot.type === 'lab' ? 'Lab' : 'Theory'}
                        </span>
                    ` : ''}
                `;
            }
            
            rowHtml += `<div class="${cellClass}">${cellContent}</div>`;
        });
        grid.innerHTML += rowHtml;
    });
    
    // Update statistics
    updateTimetableStats();
    
    // New: Render Faculty List below the timetable
    const uniqueSubjectsWithFaculty = Array.from(new Set(subjects.map(s => s.name)))
        .map(name => subjects.find(s => s.name === name));

    if (uniqueSubjectsWithFaculty.length > 0) {
        let facultyHtml = `<h4 class="text-lg font-semibold mb-3">Faculty Assignments</h4>`;
        facultyHtml += `<ul class="list-disc list-inside space-y-1 text-sm">`;
        uniqueSubjectsWithFaculty.forEach(subject => {
            if (subject.faculty) {
                facultyHtml += `<li class="font-medium"><strong>${subject.name}</strong>: ${subject.faculty}</li>`;
            }
        });
        facultyHtml += `</ul>`;
        facultyListContainer.innerHTML = facultyHtml;
    } else {
        facultyListContainer.innerHTML = '';
    }

    // Re-create icons
    setTimeout(() => lucide.createIcons(), 0);
}

function getCellClass(type) {
    switch (type) {
        case 'break':
            return 'timetable-cell period-break';
        case 'lunch':
            return 'timetable-cell period-lunch';
        case 'lab':
            return 'timetable-cell subject-lab';
        case 'theory':
            return 'timetable-cell subject-theory';
        default:
            return 'timetable-cell';
    }
}

function updateTimetableStats() {
    const theoryCount = generatedTimetable.filter(slot => slot.type === 'theory').length;
    const labCount = generatedTimetable.filter(slot => slot.type === 'lab').length;
    const totalCount = generatedTimetable.filter(slot => slot.type !== 'break' && slot.type !== 'lunch').length;
    
    document.getElementById('theoryCount').textContent = theoryCount;
    document.getElementById('labCount').textContent = labCount;
    document.getElementById('totalCount').textContent = totalCount;
}

// Download Functions
function downloadTimetable() {
    let content = `TIMETABLE - ${selectedBranch} Section ${selectedSection}\n`;
    content += '='.repeat(50) + '\n\n';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7'];
    
    days.forEach(day => {
        content += `${day.toUpperCase()}\n`;
        content += '-'.repeat(day.length) + '\n';
        periods.forEach(period => {
            const slot = generatedTimetable.find(s => s.day === day && s.period === period);
            if (slot) {
                content += `${period} (${timeSlots[period] || ''}): ${slot.subject}`;
                if (slot.classroom) content += ` - ${slot.classroom}`;
                content += '\n';
            }
        });
        content += '\n';
    });

    content += 'FACULTY ASSIGNMENTS\n';
    content += '='.repeat(20) + '\n';
    const uniqueSubjectsWithFaculty = Array.from(new Set(subjects.map(s => s.name)))
        .map(name => subjects.find(s => s.name === name));
    uniqueSubjectsWithFaculty.forEach(subject => {
        if (subject.faculty) {
            content += `${subject.name}: ${subject.faculty}\n`;
        }
    });

    downloadFile(content, `timetable-${selectedBranch}-${selectedSection}.txt`);
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}