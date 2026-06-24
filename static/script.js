// Timetable Generator JavaScript

// Global State
let currentView = 'admin';
let selectedBranch = '';
let selectedSection = '';
let subjects = [];
let generatedTimetable = [];

let facultyList = [];
// Always fetch facultyList from backend
async function fetchFacultyList() {
    try {
        const res = await fetch('/api/faculty');
        const result = await res.json();
        if (result.success && Array.isArray(result.faculty)) {
            facultyList = result.faculty.map(f => ({ id: f.id, name: f.name }));
        } else {
            facultyList = [];
        }
    } catch (e) {
        facultyList = [];
    }
}

const defaultSubjects = [
    { id: '1', name: 'Data Structures', type: 'theory', hours: 6, faculty: '' },
    { id: '2', name: 'Database Management', type: 'theory', hours: 6, faculty: '' },
    { id: '3', name: 'Operating Systems', type: 'theory', hours: 6, faculty: '' },
    { id: '4', name: 'Computer Networks', type: 'theory', hours: 6, faculty: '' },
    { id: '5', name: 'Software Engineering', type: 'theory', hours: 6, faculty: '' },
    { id: '6', name: 'DS Lab', type: 'lab', hours: 3, faculty: '' },
    { id: '7', name: 'DBMS Lab', type: 'lab', hours: 3, faculty: '' },
    { id: '8', name: 'OS Lab', type: 'lab', hours: 3, faculty: '' },
    { id: '9', name: 'CN Lab', type: 'lab', hours: 3, faculty: '' },
    { id: '10', name: 'SE Lab', type: 'lab', hours: 3, faculty: '' },
    { id: '11', name: 'LIB', type: 'theory', hours: 2, faculty: '' }
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

let selectedSections = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Universal logout button logic for all dashboards
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }
    lucide.createIcons();
    // Populate dropdowns first, then set up event listeners
    Promise.all([
        populateBranchDropdown(),
        populateSectionDropdown(),
        populateFacultyDropdown()
    ]).then(() => {
        setupEventListeners();
        updateGenerateButton();
    });

    // Add Faculty form
    const addFacultyForm = document.getElementById('addFacultyForm');
    if (addFacultyForm) {
        addFacultyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const input = document.getElementById('facultyNameInput');
            const msg = document.getElementById('addFacultyMsg');
            const name = input.value.trim();
            if (name && !facultyList.includes(name)) {
                // Add faculty to backend (if you have an API for this
                await fetch('/api/faculty', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                await fetchFacultyList(); // Refresh faculty list from backend
                input.value = '';
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 1500);
                await renderSubjects(); // Re-render subjects to update dropdowns
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

    const generateAllSectionBtn = document.getElementById('generateAllSectionBtn');
    if (generateAllSectionBtn) {
        generateAllSectionBtn.addEventListener('click', generateTimetablesForAllSections);
    }

    // Section confirm button
    const confirmSectionBtn = document.getElementById('confirmSectionBtn');
    if (confirmSectionBtn) {
        confirmSectionBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.section-checkbox');
            selectedSections = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
            updateSelectionDisplay();
            updateGenerateButton();
        });
    }

    // Subject Management
    const loadDefaultBtn = document.getElementById('loadDefaultBtn');
    if (loadDefaultBtn) {
        loadDefaultBtn.onclick = async function() {
            // Always use hardcoded defaultSubjects when button is clicked
            subjects = [...defaultSubjects];
            await renderSubjects();
            updateGenerateButton();
            await updateAllFacultyDropdowns();
        };
    }
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    if (addSubjectBtn) {
        addSubjectBtn.onclick = function() {
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
        };
    }

    // Add event listener for Save Timetable button
    const saveTimetableBtn = document.getElementById('saveTimetableBtn');
    if (saveTimetableBtn) {
        saveTimetableBtn.addEventListener('click', function() {
            saveGeneratedTimetable(generatedTimetable);
        });
    }
});
// Update all faculty dropdowns (subjects and faculty view)
async function updateAllFacultyDropdowns() {
    await fetchFacultyList(); // Always get latest faculty from backend
    // Update subject faculty selects
    subjects.forEach(subject => {
        const facultySelect = document.getElementById(`faculty-${subject.id}`);
        if (facultySelect) {
            const current = subject.faculty;
            facultySelect.innerHTML = '<option value="">Select faculty</option>' + facultyList.map(faculty => `<option value="${faculty.id}" ${current == faculty.id ? 'selected' : ''}>${faculty.name}</option>`).join('');
            facultySelect.onchange = (e) => updateSubject(subject.id, { faculty: e.target.value });
        }
    });
    // Update faculty view dropdown
    const facultySelect = document.getElementById('facultySelect');
    if (facultySelect) {
        const current = facultySelect.value;
        while (facultySelect.options.length > 1) facultySelect.remove(1);
        facultyList.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty.id;
            option.textContent = faculty.name;
            if (current == faculty.id) option.selected = true;
            facultySelect.appendChild(option);
        });
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    if (adminBtn) adminBtn.addEventListener('click', () => switchView('admin'));
    if (timetableBtn) timetableBtn.addEventListener('click', () => switchView('timetable'));
    // Faculty button may exist only on some pages
    const facultyBtn = document.getElementById('facultyBtn');
    if (facultyBtn) {
        facultyBtn.addEventListener('click', () => switchView('faculty'));
    }

    // Branch and Section (only if present on the page)
    if (branchSelect) branchSelect.addEventListener('change', handleBranchChange);
    if (sectionSelect) sectionSelect.addEventListener('change', handleSectionChange);

    // Subject Management buttons
    if (loadDefaultBtn) loadDefaultBtn.addEventListener('click', loadDefaultSubjects);
    if (addSubjectBtn) addSubjectBtn.addEventListener('click', addSubject);
    if (generateBtn) generateBtn.addEventListener('click', generateTimetable);

    // Download
    if (downloadBtn) downloadBtn.addEventListener('click', downloadTimetable);
}

// Navigation
function switchView(view) {
    // Hide all views
    document.querySelectorAll('.view').forEach(viewElement => {
        viewElement.classList.remove('active');
        viewElement.style.display = 'none';
    });
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Show the selected view and set nav button active
    if (view === 'admin') {
        adminBtn.classList.add('active');
        adminView.classList.add('active');
        adminView.style.display = 'block';
    } else if (view === 'timetable') {
        timetableBtn.classList.add('active');
        timetableView.classList.add('active');
        timetableView.style.display = 'block';
        showSectionSelectorForTimetable();
    } else if (view === 'faculty') {
        document.getElementById('facultyBtn').classList.add('active');
        document.getElementById('facultyView').classList.add('active');
        document.getElementById('facultyView').style.display = 'block';
        // Always refresh faculty dropdown and reset view
        updateAllFacultyDropdowns();
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
        option.value = faculty.id;
        option.textContent = faculty.name;
        facultySelect.appendChild(option);
    });
    facultySelect.addEventListener('change', async function() {
        const facultyId = facultySelect.value;
        if (!facultyId) {
            showNoFacultySelected();
            return;
        }
        // Fetch schedule from backend
        const res = await fetch(`/api/faculty/${facultyId}/schedule`);
        const result = await res.json();
        if (result.success) {
            renderFacultyScheduleFromDB(result.schedule);
            document.getElementById('facultyDetails').classList.remove('hidden');
            document.getElementById('noFacultySelected').classList.add('hidden');
        } else {
            showNoFacultySelected();
        }
    });
}

function showNoFacultySelected() {
    document.getElementById('facultyDetails').classList.add('hidden');
    document.getElementById('noFacultySelected').classList.remove('hidden');
}

function renderFacultyScheduleFromDB(schedule) {
    // Calculate stats
    const totalPeriods = schedule.length;
    let theoryCount = 0, labCount = 0;
    const subjects = new Set();
    schedule.forEach(slot => {
        subjects.add(slot.subject);
        if (slot.subject && slot.subject.toLowerCase().includes('lab')) labCount++;
        else theoryCount++;
    });
    document.getElementById('facultyTotalPeriods').textContent = totalPeriods;
    document.getElementById('facultyTheoryCount').textContent = theoryCount;
    document.getElementById('facultyLabCount').textContent = labCount;
    document.getElementById('facultySubjectCount').textContent = subjects.size;
    // Render subjects taught
    const subjectsList = document.getElementById('facultySubjectsList');
    subjectsList.innerHTML = '';
    subjects.forEach(subj => {
        const div = document.createElement('div');
        div.className = 'p-2 bg-primary-10 rounded mb-2';
        div.textContent = subj;
        subjectsList.appendChild(div);
    });
    // Render schedule grid for all sections
    const grid = document.getElementById('facultyScheduleGrid');
    grid.innerHTML = '';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7'];
    grid.style.gridTemplateColumns = `minmax(120px, 1fr) repeat(${periods.length}, minmax(100px, 1fr))`;
    let headerHtml = `<div class="timetable-header">Day / Time</div>`;
    periods.forEach(period => {
        headerHtml += `<div class="timetable-header text-sm"><div class="font-semibold">${period}</div><div class="text-xs opacity-90">${timeSlots[period] || ''}</div></div>`;
    });
    grid.innerHTML += headerHtml;
    days.forEach(day => {
        let rowHtml = `<div class="timetable-header">${day}</div>`;
        periods.forEach(period => {
            // Find all slots for this faculty on this day and period (across sections)
            const slots = schedule.filter(s => s.day_of_week === day && s.time_slot === period);
            let cellClass = 'timetable-cell';
            let cellContent = '';
            if (period === 'Break') cellClass += ' period-break';
            if (period === 'Lunch') cellClass += ' period-lunch';
            if (slots.length > 0) {
                cellClass += slots[0].subject && slots[0].subject.toLowerCase().includes('lab') ? ' subject-lab' : ' subject-theory';
                cellContent = slots.map(slot =>
                    `<div class='font-medium text-sm'>${slot.subject}</div><div class='text-xs'>Section: ${slot.section || slot.class_name || ''} | ${slot.room || ''}</div>`
                ).join('<hr>');
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
    if (!display) return;
    if (selectedBranch && selectedSections.length > 0) {
        display.classList.remove('hidden');
        const p = display.querySelector('p');
        if (p) p.textContent = `Selected: ${selectedBranch} - Section(s): ${selectedSections.join(', ')}`;
    } else {
        display.classList.add('hidden');
    }
}

// Subject Management
async function loadDefaultSubjects() {
    // Fetch subjects and faculty from backend
    try {
        const [subjectsRes, facultyRes] = await Promise.all([
            fetch('/api/subjects').then(res => res.json()),
            fetch('/api/faculty').then(res => res.json())
        ]);
        if (subjectsRes.success && Array.isArray(subjectsRes.subjects) && subjectsRes.subjects.length > 0) {
            subjects = subjectsRes.subjects.map(sub => ({
                id: sub.id,
                name: sub.name,
                type: sub.type || 'theory',
                hours: sub.hours || 3,
                faculty: sub.faculty_id || ''
            }));
        } else {
            // Use hardcoded defaultSubjects if backend returns none
            subjects = [...defaultSubjects];
        }
        if (facultyRes.success && Array.isArray(facultyRes.faculty)) {
            facultyList = facultyRes.faculty.map(f => ({ id: f.id, name: f.name }));
        }
        await renderSubjects();
        updateGenerateButton();
        await updateAllFacultyDropdowns();
    } catch (err) {
        // On error, fallback to default subjects
        subjects = [...defaultSubjects];
        await renderSubjects();
        updateGenerateButton();
        await updateAllFacultyDropdowns();
        console.error('Failed to load subjects or faculty:', err);
    }
}

async function addSubject() {
    // Prompt for subject details (or use a modal in real UI)
    const name = prompt('Enter subject name:', 'New Subject');
    if (!name) return;
    const type = prompt('Enter subject type (theory/lab):', 'theory');
    if (!type || (type !== 'theory' && type !== 'lab')) return alert('Invalid type');
    const hours = parseInt(prompt('Enter hours per week:', '3'), 10);
    if (isNaN(hours) || hours < 1) return alert('Invalid hours');
    // Fetch faculty list if not already loaded
    if (!facultyList || facultyList.length === 0) await fetchFacultyList();
    let facultyOptions = facultyList.map(f => `${f.id}: ${f.name}`).join('\n');
    const faculty_id = prompt('Enter faculty ID for this subject:\n' + facultyOptions, facultyList[0]?.id || '');
    if (!faculty_id || !facultyList.find(f => f.id == faculty_id)) return alert('Invalid faculty ID');
    // Optionally, select program_id (here, use first program or prompt for it)
    let program_id = 1;
    if (window.programsArr && window.programsArr.length > 0) {
        program_id = window.programsArr[0].id;
    }
    // Save to backend
    const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, hours, program_id, faculty_id })
    });
    const result = await res.json();
    if (result.success) {
        await loadDefaultSubjects(); // Refresh subjects from backend
    } else {
        alert('Error adding subject: ' + (result.message || 'Unknown error'));
    }
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

async function renderSubjects() {
    if (subjects.length === 0) {
        noSubjects.classList.remove('hidden');
        subjectsList.classList.add('hidden');
    } else {
        noSubjects.classList.add('hidden');
        subjectsList.classList.remove('hidden');
        subjectsList.innerHTML = subjects.map(subject => createSubjectHTML(subject)).join('');
        await updateAllFacultyDropdowns(); // Ensure dropdowns are populated from backend
        // Add event listeners to newly created elements
        subjects.forEach(subject => {
            const nameInput = document.getElementById(`name-${subject.id}`);
            const typeSelect = document.getElementById(`type-${subject.id}`);
            const hoursInput = document.getElementById(`hours-${subject.id}`);
            const removeBtn = document.getElementById(`remove-${subject.id}`);

            nameInput.addEventListener('input', (e) => updateSubject(subject.id, { name: e.target.value }));
            typeSelect.addEventListener('change', (e) => updateSubject(subject.id, { type: e.target.value }));
            hoursInput.addEventListener('input', (e) => updateSubject(subject.id, { hours: parseInt(e.target.value) || 1 }));
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
                            `<option value="${faculty.id}" ${subject.faculty == faculty.id ? 'selected' : ''}>${faculty.name}</option>`
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
    const canGenerate = selectedBranch && selectedSections.length > 0 && subjects.length > 0 && subjects.every(sub => sub.faculty && sub.name);
    console.log('canGenerate:', canGenerate);
    if (generateBtn) generateBtn.disabled = !canGenerate;
    if (timetableBtn) timetableBtn.disabled = generatedTimetable.length === 0;
    const helpText = document.getElementById('generateHelp');
    if (helpText) {
        if (canGenerate) helpText.classList.add('hidden');
        else helpText.classList.remove('hidden');
    }
}

// Timetable Generation
function generateTimetable() {
    if (!selectedBranch || selectedSections.length === 0 || subjects.length === 0) {
        return;
    }
    // Use the first selected section for single-section timetable
    selectedSection = selectedSections[0];
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


    // 1. No randomness: Sort subjects by hours descending, then by name for determinism
    const sortedSubjects = [...subjects].sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));
    const subjectHours = sortedSubjects.map(s => ({ ...s, hoursLeft: s.hours }));

    // 2. Place labs first, one per day, balance across week
    const labs = subjectHours.filter(s => s.type === 'lab');
    let labDayIdx = 0;
    labs.forEach(lab => {
        let placed = false;
        for (let attempt = 0; attempt < days.length; attempt++) {
            const day = days[(labDayIdx + attempt) % days.length];
            const slots = findContinuousSlots(timetableMap, day, periods, lab.hours);
            if (slots) {
                slots.forEach(period => {
                    if (!facultyConflict(timetableMap, day, period, lab.faculty)) {
                        timetableMap[day][period] = createSlot(day, period, lab, 'Lab-101'); // Use Lab-101 (matches DB)
                    }
                });
                lab.hoursLeft = 0;
                placed = true;
                labDayIdx = (labDayIdx + 1) % days.length;
                break;
            }
        }
    });
    // 3. Place theory subjects, round-robin, balance across days, prevent faculty overlap
    const theories = subjectHours.filter(s => s.type !== 'lab');
    let theoryDayIdx = 0;
    while (theories.some(t => t.hoursLeft > 0)) {
        for (let tIdx = 0; tIdx < theories.length; tIdx++) {
            const subject = theories[tIdx];
            if (subject.hoursLeft <= 0) continue;
            let assigned = false;
            for (let attempt = 0; attempt < days.length; attempt++) {
                const day = days[(theoryDayIdx + attempt) % days.length];
                const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
                for (const period of validPeriods) {
                    if (!timetableMap[day][period] && !facultyConflict(timetableMap, day, period, subject.faculty)) {
                        timetableMap[day][period] = createSlot(day, period, subject, 'Room 205'); // Use Room 205 (matches DB)
                        subject.hoursLeft--;
                        assigned = true;
                        break;
                    }
                }
                if (assigned) break;
            }
            theoryDayIdx = (theoryDayIdx + 1) % days.length;
        }
        if (!theories.some(t => t.hoursLeft > 0 && canAssign(t, timetableMap, days, periods))) break;
    }

    // After scheduling all subjects, fill any remaining empty slots with 'LIB' (or any subject with available hours)
    const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
    days.forEach(day => {
        validPeriods.forEach(period => {
            if (!timetableMap[day][period]) {
                // Find a subject with remaining hours
                let filler = subjectHours.find(s => s.hoursLeft > 0);
                if (!filler) filler = defaultSubjects.find(s => s.name === 'LIB');
                timetableMap[day][period] = createSlot(day, period, filler, 'Room 205'); // Use Room 205 (matches DB)
                if (filler.hoursLeft > 0) filler.hoursLeft--;
            }
        });
    });

    // Flatten timetableMap to generatedTimetable
    generatedTimetable = Object.values(timetableMap).flatMap(day => Object.values(day).filter(slot => slot)).map(slot => ({ ...slot, section: selectedSection }));
    
    renderTimetable();
    updateGenerateButton();
    switchView('timetable');
}

// Robust fetchMappingData: cache classes, subjects, rooms
async function fetchMappingData() {
    try {
        const [classesRes, subjectsRes, roomsRes, facultyRes] = await Promise.all([
            fetch('/api/classes').then(r => r.json()),
            fetch('/api/subjects').then(r => r.json()),
            fetch('/api/rooms').then(r => r.json()),
            fetch('/api/faculty').then(r => r.json())
        ]);

        window.classes = classesRes.success ? classesRes.classes : [];
        window.subjectsArr = subjectsRes.success ? subjectsRes.subjects : [];
        window.rooms = roomsRes.success ? roomsRes.rooms : [];
        facultyList = (facultyRes.success && Array.isArray(facultyRes.faculty)) ? facultyRes.faculty.map(f => ({ id: f.id, name: f.name })) : (facultyList || []);
    } catch (err) {
        console.warn('fetchMappingData failed:', err);
        window.classes = window.classes || [];
        window.subjectsArr = window.subjectsArr || [];
        window.rooms = window.rooms || [];
    }
}

// Tolerant mapping from UI slots to DB ids
function mapTimetableSlotsToDBIds(slots) {
    const classes = window.classes || [];
    const subjectsArr = window.subjectsArr || [];
    const rooms = window.rooms || [];

    return slots.map(slot => {
        // class mapping: match by exact or beginsWith
        const classObj = classes.find(c => c.name === slot.section || String(c.name).toLowerCase() === String(slot.section).toLowerCase())
            || classes.find(c => String(slot.section).toLowerCase().indexOf(String(c.name).toLowerCase()) !== -1);

        // subject mapping: case-insensitive exact, then contains
        let subjectObj = subjectsArr.find(s => s.name && slot.subject && s.name.toLowerCase() === slot.subject.toLowerCase());
        if (!subjectObj && slot.subject) {
            subjectObj = subjectsArr.find(s => slot.subject.toLowerCase().includes(s.name.toLowerCase()));
        }
        // fallback to LIB if not found
        if (!subjectObj) {
            subjectObj = subjectsArr.find(s => s.name && s.name.toLowerCase() === 'lib');
        }

        // faculty mapping: try id then name
        let facultyObj = null;
        if (slot.faculty) {
            facultyObj = facultyList.find(f => String(f.id) === String(slot.faculty)) || facultyList.find(f => f.name && slot.faculty && f.name.toLowerCase() === String(slot.faculty).toLowerCase());
        }
        if (!facultyObj && subjectObj && subjectObj.faculty_id) {
            facultyObj = facultyList.find(f => f.id == subjectObj.faculty_id);
        }
        if (!facultyObj) facultyObj = facultyList[0] || null;

        // room mapping: exact then contains then first room
        let roomObj = rooms.find(r => r.name === slot.classroom || (slot.classroom && r.name.toLowerCase() === slot.classroom.toLowerCase()));
        if (!roomObj && slot.classroom) {
            roomObj = rooms.find(r => r.name.toLowerCase().includes(slot.classroom.toLowerCase()));
        }
        if (!roomObj) roomObj = rooms.find(r => /room/i.test(r.name)) || rooms[0] || null;

        // time_slot: prefer same string used by UI (P1, P2, Break) - leave conversion to backend if needed
        const time_slot = slot.period || slot.time_slot || slot.time;

        // day_of_week: normalize to full day string if possible
        const day_of_week = slot.day || slot.day_of_week || slot.weekday || '';

        const mapped = {
            class_id: classObj ? classObj.id : null,
            subject_id: subjectObj ? subjectObj.id : null,
            faculty_id: facultyObj ? facultyObj.id : null,
            room_id: roomObj ? roomObj.id : null,
            day_of_week: day_of_week,
            time_slot: time_slot
        };

        // Helpful debug info
        if (!mapped.class_id || !mapped.subject_id || !mapped.faculty_id || !mapped.room_id) {
            console.warn('Mapping incomplete for slot:', slot, 'mapped:', mapped, 'classes:', classes, 'subjects:', subjectsArr, 'rooms:', rooms, 'facultyList:', facultyList);
        }

        return mapped;
    });
}

// Improved save that fills sensible defaults and reports unmapped slots
async function saveGeneratedTimetable(slots) {
    await fetchMappingData(); // ensure mapping data available

    const mappedSlots = mapTimetableSlotsToDBIds(slots);

    // Fill defaults where possible
    const rooms = window.rooms || [];
    const subjectsArr = window.subjectsArr || [];
    const defaultRoom = rooms.find(r => /room 101/i.test(r.name)) || rooms[0] || null;
    const defaultSubject = subjectsArr.find(s => s.name && s.name.toLowerCase() === 'lib') || subjectsArr[0] || null;
    const defaultFaculty = facultyList[0] || null;

    const finalSlots = mappedSlots.map(s => {
        const out = { ...s };
        if (!out.subject_id && defaultSubject) out.subject_id = defaultSubject.id;
        if (!out.room_id && defaultRoom) out.room_id = defaultRoom.id;
        if (!out.faculty_id && defaultFaculty) out.faculty_id = defaultFaculty.id;
        // ensure day/time present
        if (!out.day_of_week) out.day_of_week = 'Monday';
        if (!out.time_slot) out.time_slot = 'P1';
        return out;
    });

    // Log any remaining missing
    finalSlots.forEach(s => {
        if (!s.class_id || !s.subject_id || !s.faculty_id || !s.room_id) {
            console.error('Final slot still missing fields (will be skipped):', s);
        }
    });

    const validSlots = finalSlots.filter(s => s.class_id && s.subject_id && s.faculty_id && s.room_id && s.day_of_week && s.time_slot);

    // DEBUG: summary before sending
    console.log('Timetable save summary:', {
        totalSlots: finalSlots.length,
        validSlots: validSlots.length,
        invalidSlots: finalSlots.length - validSlots.length,
        sampleInvalid: finalSlots.filter(s => !(s.class_id && s.subject_id && s.faculty_id && s.room_id)).slice(0,5)
    });

    if (validSlots.length === 0) {
        alert('No valid timetable slots to save. Check console for mapping errors.');
        return;
    }

    try {
        const response = await fetch('/api/timetable/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slots: validSlots })
        });
        const result = await response.json();
        if (result.success) {
            alert('Timetable saved!');
        } else {
            alert('Error saving timetable: ' + (result.message || 'Unknown'));
            console.error('Save result:', result);
        }
    } catch (err) {
        console.error('Save request failed:', err);
        alert('Failed to save timetable to server. See console for details.');
    }
}

// Timetable Generation
function generateTimetable() {
    if (!selectedBranch || selectedSections.length === 0 || subjects.length === 0) {
        return;
    }
    // Use the first selected section for single-section timetable
    selectedSection = selectedSections[0];
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


    // 1. No randomness: Sort subjects by hours descending, then by name for determinism
    const sortedSubjects = [...subjects].sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));
    const subjectHours = sortedSubjects.map(s => ({ ...s, hoursLeft: s.hours }));

    // 2. Place labs first, one per day, balance across week
    const labs = subjectHours.filter(s => s.type === 'lab');
    let labDayIdx = 0;
    labs.forEach(lab => {
        let placed = false;
        for (let attempt = 0; attempt < days.length; attempt++) {
            const day = days[(labDayIdx + attempt) % days.length];
            const slots = findContinuousSlots(timetableMap, day, periods, lab.hours);
            if (slots) {
                slots.forEach(period => {
                    if (!facultyConflict(timetableMap, day, period, lab.faculty)) {
                        timetableMap[day][period] = createSlot(day, period, lab, 'Lab-101'); // Use Lab-101 (matches DB)
                    }
                });
                lab.hoursLeft = 0;
                placed = true;
                labDayIdx = (labDayIdx + 1) % days.length;
                break;
            }
        }
    });
    // 3. Place theory subjects, round-robin, balance across days, prevent faculty overlap
    const theories = subjectHours.filter(s => s.type !== 'lab');
    let theoryDayIdx = 0;
    while (theories.some(t => t.hoursLeft > 0)) {
        for (let tIdx = 0; tIdx < theories.length; tIdx++) {
            const subject = theories[tIdx];
            if (subject.hoursLeft <= 0) continue;
            let assigned = false;
            for (let attempt = 0; attempt < days.length; attempt++) {
                const day = days[(theoryDayIdx + attempt) % days.length];
                const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
                for (const period of validPeriods) {
                    if (!timetableMap[day][period] && !facultyConflict(timetableMap, day, period, subject.faculty)) {
                        timetableMap[day][period] = createSlot(day, period, subject, 'Room 205'); // Use Room 205 (matches DB)
                        subject.hoursLeft--;
                        assigned = true;
                        break;
                    }
                }
                if (assigned) break;
            }
            theoryDayIdx = (theoryDayIdx + 1) % days.length;
        }
        if (!theories.some(t => t.hoursLeft > 0 && canAssign(t, timetableMap, days, periods))) break;
    }

    // After scheduling all subjects, fill any remaining empty slots with 'LIB' (or any subject with available hours)
    const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
    days.forEach(day => {
        validPeriods.forEach(period => {
            if (!timetableMap[day][period]) {
                // Find a subject with remaining hours
                let filler = subjectHours.find(s => s.hoursLeft > 0);
                if (!filler) filler = defaultSubjects.find(s => s.name === 'LIB');
                timetableMap[day][period] = createSlot(day, period, filler, 'Room 205'); // Use Room 205 (matches DB)
                if (filler.hoursLeft > 0) filler.hoursLeft--;
            }
        });
    });

    // Flatten timetableMap to generatedTimetable
    generatedTimetable = Object.values(timetableMap).flatMap(day => Object.values(day).filter(slot => slot)).map(slot => ({ ...slot, section: selectedSection }));
    
    renderTimetable();
    updateGenerateButton();
    switchView('timetable');
}

// Robust fetchMappingData: cache classes, subjects, rooms
async function fetchMappingData() {
    try {
        const [classesRes, subjectsRes, roomsRes, facultyRes] = await Promise.all([
            fetch('/api/classes').then(r => r.json()),
            fetch('/api/subjects').then(r => r.json()),
            fetch('/api/rooms').then(r => r.json()),
            fetch('/api/faculty').then(r => r.json())
        ]);

        window.classes = classesRes.success ? classesRes.classes : [];
        window.subjectsArr = subjectsRes.success ? subjectsRes.subjects : [];
        window.rooms = roomsRes.success ? roomsRes.rooms : [];
        facultyList = (facultyRes.success && Array.isArray(facultyRes.faculty)) ? facultyRes.faculty.map(f => ({ id: f.id, name: f.name })) : (facultyList || []);
    } catch (err) {
        console.warn('fetchMappingData failed:', err);
        window.classes = window.classes || [];
        window.subjectsArr = window.subjectsArr || [];
        window.rooms = window.rooms || [];
    }
}

// Save generated timetable to backend with mapped IDs
async function saveGeneratedTimetable(slots) {
    await fetchMappingData(); // Ensure mapping data is loaded
    const mappedSlots = mapTimetableSlotsToDBIds(slots);
    // Debug: log all mapped slots and highlight those with missing fields
    console.log('All mapped slots:', mappedSlots);
    mappedSlots.forEach(slot => {
        if (!slot.class_id || !slot.subject_id || !slot.faculty_id || !slot.room_id || !slot.day_of_week || !slot.time_slot) {
            console.warn('Slot with missing fields:', slot);
        }
    });
    const validSlots = mappedSlots.filter(slot => slot.class_id && slot.subject_id && slot.faculty_id && slot.room_id && slot.day_of_week && slot.time_slot);
    if (validSlots.length === 0) {
        alert('No valid timetable slots to save. Please check your data.');
        return;
    }
    const response = await fetch('/api/timetable/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: validSlots })
    });
    const result = await response.json();
    if (result.success) {
        alert('Timetable saved!');
    } else {
        alert('Error saving timetable: ' + result.message);
    }
}

// Helper: choose a preferred room from loaded rooms based on type
function getPreferredRoom(type) {
    const rooms = window.rooms || [];
    if (rooms.length === 0) return null;
    // Prefer exact lab rooms when requesting a lab
    if (type === 'lab') {
        const labRoom = rooms.find(r => /lab/i.test(r.name) || /lab/i.test(r.features || ''));
        if (labRoom) return labRoom.name;
    }
    // Prefer a room with number 205 if present (keeps previous behavior), otherwise first theory room
    const prefer = rooms.find(r => /205/.test(r.name)) || rooms.find(r => /room/i.test(r.name)) || rooms[0];
    return prefer ? prefer.name : null;
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

async function createSlot(day, period, subject, classroom, section) {
    return {
        day,
        period,
        subject: subject.name,
        faculty: subject.faculty,
        type: subject.type,
        classroom,
        section
    };
}


function renderTimetable() {
    const grid = document.getElementById('timetableGrid');
    const subtitle = document.getElementById('timetableSubtitle');
    const facultyListContainer = document.getElementById('facultyListContainer');

    subtitle.textContent = `${selectedBranch} - Section ${selectedSection}`;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
    // FIX: Count frequency of each subject in generatedTimetable, EXCLUDE breaks
    const subjectFrequency = {};
    const subjectFacultyMap = {};
    generatedTimetable.forEach(slot => {
        if (slot.subject === 'Break' || slot.subject === 'Lunch Break') return;
        if (!subjectFrequency[slot.subject]) subjectFrequency[slot.subject] = 0;
        subjectFrequency[slot.subject]++;
        // Map subject to faculty
        if (!subjectFacultyMap[slot.subject]) {
            // Find subject in subjects array
            const subjObj = subjects.find(s => s.name === slot.subject);
            if (subjObj) {
                const facultyObj = facultyList.find(f => f.id == subjObj.faculty);
                subjectFacultyMap[slot.subject] = facultyObj ? facultyObj.name : subjObj.faculty;
            } else {
                subjectFacultyMap[slot.subject] = '';
            }
        }
    });
    if (Object.keys(subjectFrequency).length > 0) {
        let facultyHtml = `<h4 class="text-lg font-semibold mb-3">Faculty Assignments</h4>`;
        facultyHtml += `<ul class="list-disc list-inside space-y-1 text-sm">`;
        Object.entries(subjectFrequency).forEach(([subject, freq]) => {
            const facultyName = subjectFacultyMap[subject] ? ` (Faculty: ${subjectFacultyMap[subject]})` : '';
            facultyHtml += `<li class="font-medium"><strong>${subject}</strong>: ${freq}${facultyName}</li>`;
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

// New: Populate Branch and Section dropdowns from backend
async function populateBranchDropdown() {
    const select = document.getElementById('branchSelect');
    if (!select) return; // guard when branch dropdown is not on the current page
    select.innerHTML = '<option value="">Choose a branch</option>';
    try {
        const response = await fetch('/api/programs');
        const result = await response.json();
        if (result.success && Array.isArray(result.programs)) {
            result.programs.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.name; // Use department name as value
                option.textContent = `${dept.name} (${dept.code})`;
                select.appendChild(option);
            });
        }
        select.removeEventListener('change', handleBranchChange);
        select.addEventListener('change', handleBranchChange);
    } catch (err) {}
}

async function populateSectionDropdown() {
    // Populate section checkboxes. Accepts an array or comma-separated string from the API.
    const container = document.getElementById('sectionCheckboxes');
    if (!container) return;
    container.innerHTML = '';
    try {
        const response = await fetch('/api/sections');
        const result = await response.json();
        let sections = [];
        if (result && result.success) {
            if (Array.isArray(result.sections)) {
                sections = result.sections;
            } else if (typeof result.sections === 'string') {
                sections = result.sections.split(',').map(s => s.trim()).filter(Boolean);
            } else if (result.sections && typeof result.sections === 'object') {
                // In case sections is an object/map, try to extract values
                try {
                    sections = Object.values(result.sections).flat().map(s => String(s).trim()).filter(Boolean);
                } catch (e) {
                    sections = [];
                }
            }
        }

        if (!sections || sections.length === 0) {
            container.innerHTML = '<div class="text-muted-foreground">No sections available</div>';
            return;
        }

        sections.forEach(section => {
            const safeName = String(section).replace(/"/g, '&quot;');
            const id = `section-checkbox-${safeName}`;
            const label = document.createElement('label');
            label.className = 'flex items-center gap-1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = section;
            input.id = id;
            input.className = 'section-checkbox';
            label.appendChild(input);
            const txt = document.createTextNode(' Section ' + section);
            label.appendChild(txt);
            container.appendChild(label);
        });
    } catch (err) {
        console.error('Failed to populate sections', err);
    }
}

let allSectionTimetables = {}; // Store timetables for all sections
let currentSectionView = '';

// Attach event listener to the correct button for all sections
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    const generateAllSectionBtn = document.getElementById('generateAllSectionBtn');
    if (generateAllSectionBtn) {
        generateAllSectionBtn.addEventListener('click', generateTimetablesForAllSections);
    }
    // ...existing code...
});

// Replace the old generateTimetablesForAllSections with a robust version for multi-section, conflict-free timetable generation
async function generateTimetablesForAllSections() {
    if (!selectedBranch || selectedSections.length === 0 || subjects.length === 0) {
        alert('Please select branch and at least one section, and add subjects.');
        return;
    }
    const generateAllSectionBtn = document.getElementById('generateAllSectionBtn');
    if (generateAllSectionBtn) {
        generateAllSectionBtn.disabled = true;
        generateAllSectionBtn.textContent = 'Generating...';
    }
    try {
        allSectionTimetables = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const periods = ['P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7'];
        // More classrooms to reduce conflicts
        const classrooms = [
            { id: 'room1', name: 'Room 201', type: 'theory' },
            { id: 'room2', name: 'Room 202', type: 'theory' },
            { id: 'room3', name: 'Room 203', type: 'theory' },
            { id: 'room4', name: 'Room 204', type: 'theory' },
            { id: 'room5', name: 'Room 205', type: 'theory' },
            { id: 'room6', name: 'Room 206', type: 'theory' },
            { id: 'room7', name: 'Room 207', type: 'theory' }
        ];
        // Define labs array here (fixes bug)
        const labs = [
            { id: 'lab1', name: 'Lab-101', type: 'lab' },
            { id: 'lab2', name: 'Lab-102', type: 'lab' },
            { id: 'lab3', name: 'Lab-103', type: 'lab' },
            { id: 'lab4', name: 'Lab-104', type: 'lab' },
            { id: 'lab5', name: 'Lab-105', type: 'lab' }
        ];
        // Track faculty and room availability
        const facultyAvailability = {};
        facultyList.forEach(faculty => {
            facultyAvailability[faculty.id] = {};
            days.forEach(day => {
                facultyAvailability[faculty.id][day] = {};
                periods.forEach(period => {
                    facultyAvailability[faculty.id][day][period] = true;
                });
            });
        });
        
        const roomAvailability = {};
        [...classrooms, ...labs].forEach(room => {
            roomAvailability[room.id] = {};
            days.forEach(day => {
                roomAvailability[room.id][day] = {};
                periods.forEach(period => {
                    roomAvailability[room.id][day][period] = true;
                });
            });
        });
        
        let unscheduledSubjects = {};
        
        // First, schedule all labs across all sections
        const allLabs = subjects.filter(s => s.type === 'lab');
        for (const lab of allLabs) {
            if (!lab.faculty || !facultyAvailability[lab.faculty]) {
                unscheduledSubjects[lab.name] = (unscheduledSubjects[lab.name] || 0) + lab.hours;
                continue;
            }
            
            // Try to schedule this lab in each section
            for (const section of selectedSections) {
                let placed = false;
                
                // Try different days
                for (const day of days.slice().sort(() => Math.random() - 0.5)) {
                    const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
                    
                    // Try to find a continuous block for the lab
                    for (let i = 0; i <= validPeriods.length - lab.hours; i++) {
                        const slotSeq = validPeriods.slice(i, i + lab.hours);
                        
                        // Try different lab rooms
                        for (const labRoom of labs.slice().sort(() => Math.random() - 0.5)) {
                            // Check if all periods in the sequence are available
                            const allAvailable = slotSeq.every(period => 
                                facultyAvailability[lab.faculty][day][period] && 
                                roomAvailability[labRoom.id][day][period]
                            );
                            
                            if (allAvailable) {
                                // Create timetable for this section if it doesn't exist
                                if (!allSectionTimetables[section]) {
                                    allSectionTimetables[section] = initializeTimetable(days, periods, section);
                                }
                                
                                // Check if all slots are empty in this section's timetable
                                const allSlotsEmpty = slotSeq.every(period => 
                                    !allSectionTimetables[section][day][period] || 
                                    allSectionTimetables[section][day][period].subject === ''
                                );
                                
                                if (allSlotsEmpty) {
                                    // Schedule the lab
                                    slotSeq.forEach(period => {
                                        allSectionTimetables[section][day][period] = {
                                            day, period, 
                                            subject: lab.name, 
                                            faculty: lab.faculty, 
                                            type: lab.type, 
                                            classroom: labRoom.name, 
                                            section
                                        };
                                        
                                        // Mark as unavailable
                                        facultyAvailability[lab.faculty][day][period] = false;
                                        roomAvailability[labRoom.id][day][period] = false;
                                    });
                                    
                                    placed = true;
                                    break;
                                }
                            }
                            
                            if (placed) break;
                        }
                        if (placed) break;
                    }
                    if (placed) break;
                }
                
                if (!placed) {
                    unscheduledSubjects[lab.name] = (unscheduledSubjects[lab.name] || 0) + lab.hours;
                }
            }
        }
        
        // Now schedule theory subjects
        const allTheories = subjects.filter(s => s.type === 'theory');
        
        // Sort theories by hours (highest first) to schedule difficult ones first
        const sortedTheories = [...allTheories].sort((a, b) => b.hours - a.hours);
        
        for (const theory of sortedTheories) {
            if (!theory.faculty || !facultyAvailability[theory.faculty]) {
                unscheduledSubjects[theory.name] = (unscheduledSubjects[theory.name] || 0) + theory.hours;
                continue;
            }
            
            let hoursLeft = theory.hours;
            
            // Try to schedule this theory in each section
            for (const section of selectedSections) {
                // Create timetable for this section if it doesn't exist
                if (!allSectionTimetables[section]) {
                    allSectionTimetables[section] = initializeTimetable(days, periods, section);
                }
                
                let sectionHoursLeft = theory.hours;
                
                // Try to schedule the required hours
                while (sectionHoursLeft > 0) {
                    let scheduled = false;
                    
                    // Try different days
                    for (const day of days.slice().sort(() => Math.random() - 0.5)) {
                        const validPeriods = periods.filter(p => p !== 'Break' && p !== 'Lunch');
                        
                        // Try different periods
                        for (const period of validPeriods.slice().sort(() => Math.random() - 0.5)) {
                            // Try different classrooms
                            for (const classroom of classrooms.slice().sort(() => Math.random() - 0.5)) {
                                // Check if available
                                if (facultyAvailability[theory.faculty][day][period] && 
                                    roomAvailability[classroom.id][day][period] &&
                                    (!allSectionTimetables[section][day][period] || 
                                     allSectionTimetables[section][day][period].subject === '')
                                   ) {
                                    
                                    // Schedule the theory
                                    allSectionTimetables[section][day][period] = {
                                        day, period, 
                                        subject: theory.name, 
                                        faculty: theory.faculty, 
                                        type: theory.type, 
                                        classroom: classroom.name, 
                                        section
                                    };
                                    
                                    // Mark as unavailable
                                    facultyAvailability[theory.faculty][day][period] = false;
                                    roomAvailability[classroom.id][day][period] = false;
                                    
                                    scheduled = true;
                                    sectionHoursLeft--;
                                    hoursLeft--;
                                    break;
                                }
                            }
                            
                            if (scheduled) break;
                        }
                        
                        if (scheduled) break;
                    }
                    
                    // If we couldn't schedule in this iteration, break to avoid infinite loop
                    if (!scheduled) break;
                }
                
                if (sectionHoursLeft > 0) {
                    unscheduledSubjects[theory.name] = (unscheduledSubjects[theory.name] || 0) + sectionHoursLeft;
                }
            }
            
            if (hoursLeft > 0) {
                unscheduledSubjects[theory.name] = (unscheduledSubjects[theory.name] || 0) + hoursLeft;
            }
        }
        
        // Fill any remaining empty slots with additional subjects if possible
        fillRemainingSlots(days, periods, allSectionTimetables, facultyAvailability, roomAvailability, classrooms, labs);
        
        // Ensure every selected section has a timetable initialized and filled
        selectedSections.forEach(section => {
            if (!allSectionTimetables[section]) {
                allSectionTimetables[section] = initializeTimetable(days, periods, section);
                fillRemainingSlots(days, periods, allSectionTimetables, facultyAvailability, roomAvailability, classrooms, labs);
            }
        });
        
        // Convert the timetable maps to arrays for rendering
        for (const section in allSectionTimetables) {
            const sectionTimetableMap = allSectionTimetables[section];
            const sectionSlots = [];
            
            for (const day of days) {
                for (const period of periods) {
                    if (sectionTimetableMap[day][period]) {
                        sectionSlots.push(sectionTimetableMap[day][period]);
                    }
                }
            }
            
            allSectionTimetables[section] = sectionSlots;
        }
        
        // Show the first section's timetable by default
        currentSectionView = selectedSections[0];
        generatedTimetable = allSectionTimetables[currentSectionView] || [];
        renderTimetable();
        updateGenerateButton();
        switchView('timetable');
    } catch (error) {
        // Fallback: ensure all selected sections have a timetable with placeholders
        selectedSections.forEach(section => {
            if (!allSectionTimetables[section]) {
                allSectionTimetables[section] = initializeTimetable(days, periods, section);
                // Fill all empty slots with placeholder
                for (const day of days) {
                    for (const period of periods) {
                        if (period !== 'Break' && period !== 'Lunch' && (!allSectionTimetables[section][day][period] || allSectionTimetables[section][day][period].subject === '')) {
                            allSectionTimetables[section][day][period] = {
                                day, period,
                                subject: 'LIB',
                                faculty: '',
                                type: 'theory',
                                classroom: '',
                                section
                            };
                        }
                    }
                }
            }
        });
        // Convert the timetable maps to arrays for rendering
        for (const section in allSectionTimetables) {
            const sectionTimetableMap = allSectionTimetables[section];
            const sectionSlots = [];
            for (const day of days) {
                for (const period of periods) {
                    if (sectionTimetableMap[day][period]) {
                        sectionSlots.push(sectionTimetableMap[day][period]);
                    }
                }
            }
            allSectionTimetables[section] = sectionSlots;
        }
        currentSectionView = selectedSections[0];
        generatedTimetable = allSectionTimetables[currentSectionView] || [];
        renderTimetable();
        updateGenerateButton();
        switchView('timetable');
        showSectionSelectorForTimetable();
        alert('Some timetables could not be fully generated. All sections are shown with placeholders.');
    } finally {
        if (generateAllSectionBtn) {
            generateAllSectionBtn.disabled = false;
            generateAllSectionBtn.textContent = 'Generate Timetables for All Sections';
        }
    }
}

// Helper function to initialize an empty timetable
function initializeTimetable(days, periods, section) {
    const timetableMap = {};
    
    days.forEach(day => {
        timetableMap[day] = {};
        periods.forEach(period => {
            if (period === 'Break') {
                timetableMap[day][period] = {
                    day, period: 'Break', 
                    subject: 'Break', 
                    faculty: '', 
                    type: 'break', 
                    section, 
                    classroom: ''
                };
            } else if (period === 'Lunch') {
                timetableMap[day][period] = {
                    day, period: 'Lunch', 
                    subject: 'Lunch Break', 
                    faculty: '', 
                    type: 'lunch', 
                    section, 
                    classroom: ''
                };
            } else {
                timetableMap[day][period] = null;
            }
        });
    });
    
    return timetableMap;
}

// Helper function to fill any remaining empty slots
function fillRemainingSlots(days, periods, allSectionTimetables, facultyAvailability, roomAvailability, classrooms, labs) {
    // Get all subjects that could potentially fill empty slots
    const allSubjects = subjects.filter(s => s.faculty && facultyAvailability[s.faculty]);
    // Pick a default faculty for LIB fallback (first in facultyList)
    const defaultFaculty = facultyList.length > 0 ? facultyList[0].id : '';
    for (const section in allSectionTimetables) {
        const timetable = allSectionTimetables[section];
        for (const day of days) {
            for (const period of periods) {
                if (period !== 'Break' && period !== 'Lunch' && 
                    (!timetable[day][period] || timetable[day][period].subject === '')) {
                    let filled = false;
                    // Try to find a subject to fill this slot
                    for (const subject of allSubjects.slice().sort(() => Math.random() - 0.5)) {
                        // Determine appropriate room type
                        const appropriateRooms = subject.type === 'lab' ? labs : classrooms;
                        for (const room of appropriateRooms.slice().sort(() => Math.random() - 0.5)) {
                            if (facultyAvailability[subject.faculty][day][period] && 
                                roomAvailability[room.id][day][period]) {
                                // Fill the slot
                                timetable[day][period] = {
                                    day, period, 
                                    subject: subject.name, 
                                    faculty: subject.faculty, 
                                    type: subject.type, 
                                    classroom: room.name, 
                                    section
                                };
                                facultyAvailability[subject.faculty][day][period] = false;
                                roomAvailability[room.id][day][period] = false;
                                filled = true;
                                break;
                            }
                        }
                        if (filled) break;
                    }
                    // If no subject could be assigned, fill with LIB and assign a default faculty
                    if (!filled) {
                        timetable[day][period] = {
                            day, period,
                            subject: 'LIB',
                            faculty: defaultFaculty,
                            type: 'theory',
                            classroom: '',
                            section
                        };
                    }
                }
            }
        }
    }
}

// New: Section selector UI above the timetable grid
function showSectionSelectorForTimetable() {
    const containerId = 'sectionSelectorContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.marginBottom = '16px';
        container.style.display = 'flex';
        container.style.gap = '8px';
        const timetableView = document.getElementById('timetableView');
        timetableView.insertBefore(container, timetableView.firstChild);
    }
    container.innerHTML = '';
    selectedSections.forEach(section => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline btn-sm';
        btn.textContent = `Section ${section}`;
        if (currentSectionView === section) {
            btn.classList.add('btn-primary');
        }
        btn.onclick = () => {
            currentSectionView = section;
            generatedTimetable = allSectionTimetables[section] || [];
            renderTimetable();
            showSectionSelectorForTimetable();
        };
        container.appendChild(btn);
    });
}

// Helper: Call this after adding a new section to refresh the section checkboxes
function refreshSectionsAfterAdd() {
    populateSectionDropdown();
}

// Sample schedule loader for faculty view
function loadSampleFacultySchedule() {
    const sample = [
        { day_of_week: 'Monday', time_slot: 'P1', subject: 'Data Structures', room: 'Room 201', section: 'CSE-A' },
        { day_of_week: 'Monday', time_slot: 'P3', subject: 'DS Lab', room: 'Lab-101', section: 'CSE-A' },
        { day_of_week: 'Tuesday', time_slot: 'P2', subject: 'Operating Systems', room: 'Room 202', section: 'CSE-A' },
        { day_of_week: 'Wednesday', time_slot: 'P5', subject: 'Computer Networks', room: 'Room 203', section: 'CSE-A' },
        { day_of_week: 'Thursday', time_slot: 'P4', subject: 'Software Engineering', room: 'Room 204', section: 'CSE-A' },
        { day_of_week: 'Friday', time_slot: 'P2', subject: 'DBMS', room: 'Room 205', section: 'CSE-A' }
    ];
    try {
        if (typeof renderFacultyScheduleGrid === 'function') renderFacultyScheduleGrid(sample);
        const fd = document.getElementById('facultyDetails'); if (fd) fd.classList.remove('hidden');
        const nf = document.getElementById('noFacultySelected'); if (nf) nf.classList.add('hidden');
    } catch (err) {
        console.error('Failed to load sample schedule:', err);
    }
}
// expose for HTML onclick
window.loadSampleFacultySchedule = loadSampleFacultySchedule;