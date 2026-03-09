/**
 * GradeCalc - Academic Dashboard & Grade Calculator
 * Main application logic
 */

(function () {
  'use strict';

  // ===== Grading Scale =====
  const GRADING_SCALE = [
    { letter: 'A+', min: 97, gpa: 4.0 },
    { letter: 'A',  min: 93, gpa: 4.0 },
    { letter: 'A-', min: 90, gpa: 3.7 },
    { letter: 'B+', min: 87, gpa: 3.3 },
    { letter: 'B',  min: 83, gpa: 3.0 },
    { letter: 'B-', min: 80, gpa: 2.7 },
    { letter: 'C+', min: 77, gpa: 2.3 },
    { letter: 'C',  min: 73, gpa: 2.0 },
    { letter: 'C-', min: 70, gpa: 1.7 },
    { letter: 'D+', min: 67, gpa: 1.3 },
    { letter: 'D',  min: 63, gpa: 1.0 },
    { letter: 'D-', min: 60, gpa: 0.7 },
    { letter: 'F',  min: 0,  gpa: 0.0 },
  ];

  function getLetterGrade(pct) {
    if (pct == null || isNaN(pct)) return '--';
    for (const g of GRADING_SCALE) {
      if (pct >= g.min) return g.letter;
    }
    return 'F';
  }

  function getGpaPoints(pct) {
    if (pct == null || isNaN(pct)) return null;
    for (const g of GRADING_SCALE) {
      if (pct >= g.min) return g.gpa;
    }
    return 0.0;
  }

  function getGradeColorClass(letter) {
    if (!letter || letter === '--') return '';
    if (letter.startsWith('A')) return 'grade-a';
    if (letter.startsWith('B')) return 'grade-b';
    if (letter.startsWith('C')) return 'grade-c';
    if (letter.startsWith('D')) return 'grade-d';
    return 'grade-f';
  }

  // ===== Data Store =====
  const STORAGE_KEY = 'gradecalc_data';

  function getDefaultData() {
    return {
      settings: {
        term: '',
        defaultScale: 'percentage',
      },
      courses: [],
      programs: [],
      activity: [],
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults to handle missing keys
        const defaults = getDefaultData();
        return {
          settings: { ...defaults.settings, ...(parsed.settings || {}) },
          courses: parsed.courses || [],
          programs: parsed.programs || [],
          activity: parsed.activity || [],
        };
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage:', e);
    }
    return getDefaultData();
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  let appData = loadData();

  // ===== Activity Log =====
  function addActivity(text) {
    appData.activity.unshift({
      text: text,
      time: new Date().toISOString(),
    });
    if (appData.activity.length > 50) {
      appData.activity = appData.activity.slice(0, 50);
    }
    saveData();
  }

  // ===== UUID-like ID =====
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ===== Toast =====
  function showToast(msg) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ===== DOM References =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const sidebar = $('#sidebar');
  const menuToggle = $('#menuToggle');
  const mainContent = $('#mainContent');
  const viewTitle = $('#viewTitle');

  // ===== Navigation =====
  const viewTitles = {
    dashboard: 'Dashboard',
    calculator: 'Grade Calculator',
    programs: 'Academic Programs',
    gpa: 'GPA Overview',
    settings: 'Settings',
  };

  let currentView = 'dashboard';

  function switchView(view) {
    if (!viewTitles[view]) return;
    currentView = view;

    $$('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    $$('.view').forEach((v) => {
      v.classList.toggle('active', v.id === 'view-' + view);
    });

    viewTitle.textContent = viewTitles[view];
    closeSidebar();

    // Refresh view data
    if (view === 'dashboard') refreshDashboard();
    if (view === 'gpa') refreshGpa();
  }

  $$('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  $$('[data-navigate]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.navigate));
  });

  // Sidebar mobile toggle
  let overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  menuToggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // ===== Settings =====
  const settingTerm = $('#settingTerm');
  const settingScale = $('#settingScale');

  function initSettings() {
    settingTerm.value = appData.settings.term || '';
    settingScale.value = appData.settings.defaultScale || 'percentage';
    updateTermDisplay();
  }

  function updateTermDisplay() {
    const term = appData.settings.term || 'Current Term';
    $('#currentTerm').textContent = term;
  }

  settingTerm.addEventListener('change', () => {
    appData.settings.term = settingTerm.value.trim();
    updateTermDisplay();
    saveData();
  });

  settingScale.addEventListener('change', () => {
    appData.settings.defaultScale = settingScale.value;
    saveData();
  });

  // Export all data
  $('#exportAllData').addEventListener('click', () => {
    exportDataAsJson();
  });

  // Import data
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.courses || imported.programs) {
          appData = {
            settings: { ...getDefaultData().settings, ...(imported.settings || {}) },
            courses: imported.courses || [],
            programs: imported.programs || [],
            activity: imported.activity || [],
          };
          saveData();
          initSettings();
          refreshCourseSelect();
          refreshDashboard();
          refreshGpa();
          renderPrograms();
          showToast('Data imported successfully.');
        } else {
          showToast('Invalid data file.');
        }
      } catch (err) {
        showToast('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Reset all data
  $('#resetAllData').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      appData = getDefaultData();
      saveData();
      initSettings();
      refreshCourseSelect();
      selectCourse('');
      refreshDashboard();
      refreshGpa();
      renderPrograms();
      showToast('All data has been reset.');
    }
  });

  function exportDataAsJson() {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gradecalc-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported.');
  }

  // ===== Grade Calculator =====
  const courseSelect = $('#courseSelect');
  const addCourseBtn = $('#addCourseBtn');
  const addCourseModal = $('#addCourseModal');
  const closeAddCourse = $('#closeAddCourse');
  const cancelAddCourse = $('#cancelAddCourse');
  const confirmAddCourse = $('#confirmAddCourse');
  const courseInfoBar = $('#courseInfoBar');
  const calcEmpty = $('#calcEmpty');
  const spreadsheetWrapper = $('#spreadsheetWrapper');

  let selectedCourseId = '';

  function refreshCourseSelect() {
    const options = ['<option value="">-- Select or add a course --</option>'];
    appData.courses.forEach((c) => {
      const label = c.code ? `${c.code} - ${c.name}` : c.name;
      options.push(`<option value="${c.id}">${label}</option>`);
    });
    courseSelect.innerHTML = options.join('');
    courseSelect.value = selectedCourseId || '';
  }

  function selectCourse(courseId) {
    selectedCourseId = courseId;
    courseSelect.value = courseId;

    if (!courseId) {
      courseInfoBar.style.display = 'none';
      calcEmpty.style.display = '';
      spreadsheetWrapper.style.display = 'none';
      return;
    }

    const course = appData.courses.find((c) => c.id === courseId);
    if (!course) {
      selectCourse('');
      return;
    }

    calcEmpty.style.display = 'none';
    courseInfoBar.style.display = '';
    spreadsheetWrapper.style.display = '';

    // Update info bar
    $('#courseInfoName').textContent = course.name;
    $('#courseInfoCode').textContent = course.code || '';
    $('#courseInfoCode').style.display = course.code ? '' : 'none';
    $('#courseInfoCredits').textContent = course.credits ? course.credits + ' credits' : '';
    $('#courseInfoCredits').style.display = course.credits ? '' : 'none';
    $('#courseInfoSubject').textContent = course.subject || '';
    $('#courseInfoSubject').style.display = course.subject ? '' : 'none';

    renderCategories(course);
    renderAssignments(course);
    updateCourseSummary(course);
    updateCategoryFilter(course);
  }

  courseSelect.addEventListener('change', () => {
    selectCourse(courseSelect.value);
  });

  // Add course modal
  addCourseBtn.addEventListener('click', () => {
    clearCourseForm();
    addCourseModal.classList.add('show');
  });
  closeAddCourse.addEventListener('click', () => addCourseModal.classList.remove('show'));
  cancelAddCourse.addEventListener('click', () => addCourseModal.classList.remove('show'));

  addCourseModal.addEventListener('click', (e) => {
    if (e.target === addCourseModal) addCourseModal.classList.remove('show');
  });

  function clearCourseForm() {
    $('#newCourseName').value = '';
    $('#newCourseCode').value = '';
    $('#newCourseCredits').value = '';
    $('#newCourseSubject').value = '';
    $('#newGradingScale').value = appData.settings.defaultScale || 'percentage';
  }

  confirmAddCourse.addEventListener('click', () => {
    const name = $('#newCourseName').value.trim();
    if (!name) {
      showToast('Please enter a course name.');
      return;
    }

    const course = {
      id: genId(),
      name: name,
      code: $('#newCourseCode').value.trim(),
      credits: parseFloat($('#newCourseCredits').value) || 0,
      subject: $('#newCourseSubject').value,
      gradingScale: $('#newGradingScale').value,
      categories: [],
      assignments: [],
    };

    appData.courses.push(course);
    addActivity(`Added course: ${course.name}`);
    saveData();

    refreshCourseSelect();
    selectCourse(course.id);
    addCourseModal.classList.remove('show');
    showToast(`Course "${name}" added.`);
  });

  // Clear all in calculator
  $('#clearAllBtn').addEventListener('click', () => {
    if (!selectedCourseId) return;
    const course = appData.courses.find((c) => c.id === selectedCourseId);
    if (!course) return;
    if (confirm(`Clear all categories and assignments for "${course.name}"?`)) {
      course.categories = [];
      course.assignments = [];
      addActivity(`Cleared all data for: ${course.name}`);
      saveData();
      selectCourse(selectedCourseId);
      showToast('Course data cleared.');
    }
  });

  // Export current course
  $('#exportBtn').addEventListener('click', () => {
    if (!selectedCourseId) {
      showToast('Select a course first.');
      return;
    }
    exportDataAsJson();
  });

  // ===== Categories =====
  const categoriesBody = $('#categoriesBody');
  const addCategoryBtn = $('#addCategoryBtn');

  addCategoryBtn.addEventListener('click', () => {
    const course = appData.courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    course.categories.push({
      id: genId(),
      name: '',
      weight: 0,
    });
    saveData();
    renderCategories(course);
    updateCategoryFilter(course);
  });

  function renderCategories(course) {
    if (!course.categories.length) {
      categoriesBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:16px;">No categories. Click "+ Add Category" to define grade weights.</td></tr>`;
      $('#totalWeight').textContent = '0%';
      $('#totalWeighted').textContent = '--';
      return;
    }

    let html = '';
    course.categories.forEach((cat, idx) => {
      const avg = computeCategoryAverage(course, cat.id);
      const weighted = (avg !== null && cat.weight > 0) ? ((avg * cat.weight) / 100) : null;

      html += `<tr data-cat-id="${cat.id}">
        <td><input type="text" value="${escHtml(cat.name)}" placeholder="e.g. Homework" data-field="name" class="cat-input"></td>
        <td><input type="number" value="${cat.weight || ''}" placeholder="0" min="0" max="100" step="0.5" data-field="weight" class="cat-input"></td>
        <td style="text-align:right;">${avg !== null ? avg.toFixed(1) + '%' : '--'}</td>
        <td style="text-align:right;font-weight:500;">${weighted !== null ? weighted.toFixed(2) + '%' : '--'}</td>
        <td style="text-align:center;">
          <button class="btn-delete-row" data-delete-cat="${cat.id}" title="Remove category">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </td>
      </tr>`;
    });

    categoriesBody.innerHTML = html;

    // Totals
    const totalWeight = course.categories.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
    const totalWeighted = computeOverallGrade(course);

    $('#totalWeight').textContent = totalWeight.toFixed(1) + '%';
    $('#totalWeight').style.color = Math.abs(totalWeight - 100) < 0.01 ? 'var(--color-success)' : (totalWeight > 100 ? 'var(--color-danger)' : 'var(--color-text)');
    $('#totalWeighted').textContent = totalWeighted !== null ? totalWeighted.toFixed(2) + '%' : '--';

    // Bind events
    categoriesBody.querySelectorAll('.cat-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        const catId = row.dataset.catId;
        const cat = course.categories.find((c) => c.id === catId);
        if (!cat) return;
        const field = e.target.dataset.field;
        if (field === 'weight') {
          cat.weight = parseFloat(e.target.value) || 0;
        } else {
          cat[field] = e.target.value.trim();
        }
        saveData();
        renderCategories(course);
        updateCourseSummary(course);
        updateCategoryFilter(course);
      });
    });

    categoriesBody.querySelectorAll('[data-delete-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.deleteCat;
        course.categories = course.categories.filter((c) => c.id !== catId);
        // Also remove assignments in this category
        course.assignments = course.assignments.filter((a) => a.categoryId !== catId);
        saveData();
        renderCategories(course);
        renderAssignments(course);
        updateCourseSummary(course);
        updateCategoryFilter(course);
      });
    });
  }

  // ===== Assignments =====
  const assignmentsBody = $('#assignmentsBody');
  const addAssignmentBtn = $('#addAssignmentBtn');
  const emptyAssignments = $('#emptyAssignments');
  const filterCategory = $('#filterCategory');

  let currentCategoryFilter = 'all';

  addAssignmentBtn.addEventListener('click', () => {
    const course = appData.courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const defaultCat = course.categories.length > 0 ? course.categories[0].id : '';

    course.assignments.push({
      id: genId(),
      name: '',
      categoryId: defaultCat,
      score: null,
      maxScore: 100,
      date: '',
    });
    addActivity(`Added assignment to: ${course.name}`);
    saveData();
    renderAssignments(course);
    updateCourseSummary(course);
    renderCategories(course);
  });

  filterCategory.addEventListener('change', () => {
    currentCategoryFilter = filterCategory.value;
    const course = appData.courses.find((c) => c.id === selectedCourseId);
    if (course) renderAssignments(course);
  });

  function updateCategoryFilter(course) {
    const options = ['<option value="all">All Categories</option>'];
    course.categories.forEach((cat) => {
      options.push(`<option value="${cat.id}">${escHtml(cat.name || 'Unnamed')}</option>`);
    });
    filterCategory.innerHTML = options.join('');
    filterCategory.value = currentCategoryFilter;
  }

  function renderAssignments(course) {
    let assignments = course.assignments;
    if (currentCategoryFilter !== 'all') {
      assignments = assignments.filter((a) => a.categoryId === currentCategoryFilter);
    }

    if (!assignments.length) {
      assignmentsBody.innerHTML = '';
      emptyAssignments.style.display = '';
      return;
    }

    emptyAssignments.style.display = 'none';
    let html = '';

    assignments.forEach((asgn, idx) => {
      const pct = (asgn.score !== null && asgn.maxScore > 0) ? (asgn.score / asgn.maxScore) * 100 : null;
      const letter = getLetterGrade(pct);
      const colorClass = getGradeColorClass(letter);

      // Category select options
      let catOptions = '<option value="">-- None --</option>';
      course.categories.forEach((cat) => {
        const sel = cat.id === asgn.categoryId ? 'selected' : '';
        catOptions += `<option value="${cat.id}" ${sel}>${escHtml(cat.name || 'Unnamed')}</option>`;
      });

      html += `<tr data-asgn-id="${asgn.id}">
        <td style="text-align:center;color:var(--color-text-muted);">${idx + 1}</td>
        <td><input type="text" value="${escHtml(asgn.name)}" placeholder="Assignment name" data-field="name" class="asgn-input"></td>
        <td><select data-field="categoryId" class="asgn-input">${catOptions}</select></td>
        <td><input type="number" value="${asgn.score !== null ? asgn.score : ''}" placeholder="--" min="0" step="0.01" data-field="score" class="asgn-input"></td>
        <td><input type="number" value="${asgn.maxScore || ''}" placeholder="100" min="0.01" step="0.01" data-field="maxScore" class="asgn-input"></td>
        <td style="text-align:right;font-weight:500;">${pct !== null ? pct.toFixed(1) + '%' : '--'}</td>
        <td style="text-align:center;" class="${colorClass}">${letter}</td>
        <td><input type="date" value="${asgn.date || ''}" data-field="date" class="asgn-input"></td>
        <td style="text-align:center;">
          <button class="btn-delete-row" data-delete-asgn="${asgn.id}" title="Remove assignment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </td>
      </tr>`;
    });

    assignmentsBody.innerHTML = html;

    // Bind events
    assignmentsBody.querySelectorAll('.asgn-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        const asgnId = row.dataset.asgnId;
        const asgn = course.assignments.find((a) => a.id === asgnId);
        if (!asgn) return;
        const field = e.target.dataset.field;
        if (field === 'score') {
          const val = e.target.value.trim();
          asgn.score = val === '' ? null : parseFloat(val);
        } else if (field === 'maxScore') {
          asgn.maxScore = parseFloat(e.target.value) || 100;
        } else if (field === 'categoryId') {
          asgn.categoryId = e.target.value;
        } else {
          asgn[field] = e.target.value.trim();
        }
        saveData();
        renderAssignments(course);
        renderCategories(course);
        updateCourseSummary(course);
      });
    });

    assignmentsBody.querySelectorAll('[data-delete-asgn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const asgnId = btn.dataset.deleteAsgn;
        course.assignments = course.assignments.filter((a) => a.id !== asgnId);
        saveData();
        renderAssignments(course);
        renderCategories(course);
        updateCourseSummary(course);
      });
    });
  }

  // ===== Grade Calculations =====
  function computeCategoryAverage(course, categoryId) {
    const assignments = course.assignments.filter(
      (a) => a.categoryId === categoryId && a.score !== null && a.maxScore > 0
    );
    if (!assignments.length) return null;

    const totalScore = assignments.reduce((s, a) => s + a.score, 0);
    const totalMax = assignments.reduce((s, a) => s + a.maxScore, 0);
    return (totalScore / totalMax) * 100;
  }

  function computeOverallGrade(course) {
    if (!course.categories.length) {
      // No categories: simple average of all assignments
      const assignments = course.assignments.filter((a) => a.score !== null && a.maxScore > 0);
      if (!assignments.length) return null;
      const totalScore = assignments.reduce((s, a) => s + a.score, 0);
      const totalMax = assignments.reduce((s, a) => s + a.maxScore, 0);
      return (totalScore / totalMax) * 100;
    }

    // Weighted average by categories
    let totalWeight = 0;
    let weightedSum = 0;
    let hasAnyGrades = false;

    course.categories.forEach((cat) => {
      const avg = computeCategoryAverage(course, cat.id);
      if (avg !== null && cat.weight > 0) {
        weightedSum += avg * (cat.weight / 100);
        totalWeight += cat.weight / 100;
        hasAnyGrades = true;
      }
    });

    if (!hasAnyGrades) return null;

    // Normalize if total weight != 1 (proportional to entered weights)
    if (totalWeight > 0 && Math.abs(totalWeight - 1) > 0.001) {
      return weightedSum / totalWeight;
    }

    return weightedSum;
  }

  function updateCourseSummary(course) {
    const grade = computeOverallGrade(course);
    const letter = getLetterGrade(grade);
    const gpa = getGpaPoints(grade);
    const count = course.assignments.filter((a) => a.score !== null).length;

    $('#summaryGrade').textContent = grade !== null ? grade.toFixed(2) + '%' : '--';
    $('#summaryLetter').textContent = letter;
    $('#summaryLetter').className = 'summary-value ' + getGradeColorClass(letter);
    $('#summaryGpa').textContent = gpa !== null ? gpa.toFixed(1) : '--';
    $('#summaryCount').textContent = count;

    // Update course info bar grade
    $('#courseGradeValue').textContent = grade !== null ? grade.toFixed(1) + '%' : '--';
    $('#courseGradeLetter').textContent = letter !== '--' ? letter : '';
    $('#courseGradeLetter').className = 'course-grade-letter ' + getGradeColorClass(letter);
  }

  // ===== Dashboard =====
  function refreshDashboard() {
    // Stats
    const coursesWithGrades = appData.courses.filter((c) => {
      return c.assignments && c.assignments.some((a) => a.score !== null);
    });

    const totalAssignments = appData.courses.reduce(
      (s, c) => s + (c.assignments ? c.assignments.filter((a) => a.score !== null).length : 0),
      0
    );

    $('#statCourses').textContent = appData.courses.length;
    $('#statAssignments').textContent = totalAssignments;

    // GPA
    if (coursesWithGrades.length > 0) {
      let totalQuality = 0;
      let totalCredits = 0;
      coursesWithGrades.forEach((c) => {
        const grade = computeOverallGrade(c);
        const gpa = getGpaPoints(grade);
        const credits = parseFloat(c.credits) || 0;
        if (gpa !== null && credits > 0) {
          totalQuality += gpa * credits;
          totalCredits += credits;
        }
      });
      if (totalCredits > 0) {
        $('#statGpa').textContent = (totalQuality / totalCredits).toFixed(2);
        $('#statGpa').parentElement.querySelector('.stat-sub').textContent = `${totalCredits} credits`;
      } else {
        $('#statGpa').textContent = '--';
        $('#statGpa').parentElement.querySelector('.stat-sub').textContent = 'No data yet';
      }
    } else {
      $('#statGpa').textContent = '--';
      $('#statGpa').parentElement.querySelector('.stat-sub').textContent = 'No data yet';
    }

    // Activity
    const dashboardEmpty = $('#dashboardEmpty');
    const activityList = $('#activityList');

    if (appData.activity.length === 0) {
      dashboardEmpty.style.display = '';
      activityList.style.display = 'none';
    } else {
      dashboardEmpty.style.display = 'none';
      activityList.style.display = '';
      activityList.innerHTML = appData.activity.slice(0, 10).map((a) => {
        const time = formatTimeAgo(a.time);
        return `<div class="activity-item">
          <div class="activity-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/></svg>
          </div>
          <div class="activity-text">${escHtml(a.text)}</div>
          <div class="activity-time">${time}</div>
        </div>`;
      }).join('');
    }
  }

  function formatTimeAgo(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 7) return days + 'd ago';
    return new Date(isoStr).toLocaleDateString();
  }

  // ===== GPA Overview =====
  function refreshGpa() {
    const coursesWithGrades = appData.courses.filter((c) => {
      return c.assignments && c.assignments.some((a) => a.score !== null);
    });

    let totalQuality = 0;
    let totalCredits = 0;
    let totalCoursesCount = 0;

    const rows = [];

    appData.courses.forEach((c) => {
      const grade = computeOverallGrade(c);
      const letter = getLetterGrade(grade);
      const gpa = getGpaPoints(grade);
      const credits = parseFloat(c.credits) || 0;
      const quality = (gpa !== null && credits > 0) ? gpa * credits : 0;

      if (gpa !== null && credits > 0) {
        totalQuality += quality;
        totalCredits += credits;
        totalCoursesCount++;
      }

      rows.push({
        name: c.code ? `${c.code} - ${c.name}` : c.name,
        credits: credits,
        grade: grade,
        letter: letter,
        gpa: gpa,
        quality: quality,
      });
    });

    const cumulativeGpa = totalCredits > 0 ? (totalQuality / totalCredits) : null;

    $('#cumulativeGpa').textContent = cumulativeGpa !== null ? cumulativeGpa.toFixed(2) : '--';
    $('#termGpa').textContent = cumulativeGpa !== null ? cumulativeGpa.toFixed(2) : '--';
    $('#totalCredits').textContent = totalCredits;
    $('#totalCourses').textContent = appData.courses.length;

    // Breakdown table
    const gpaEmpty = $('#gpaEmpty');
    const gpaBreakdownWrap = $('#gpaBreakdownWrap');
    const gpaBreakdownBody = $('#gpaBreakdownBody');

    if (!rows.length) {
      gpaEmpty.style.display = '';
      gpaBreakdownWrap.style.display = 'none';
      return;
    }

    gpaEmpty.style.display = 'none';
    gpaBreakdownWrap.style.display = '';

    gpaBreakdownBody.innerHTML = rows.map((r) => {
      const colorClass = getGradeColorClass(r.letter);
      return `<tr>
        <td>${escHtml(r.name)}</td>
        <td style="text-align:right;">${r.credits || '--'}</td>
        <td style="text-align:right;">${r.grade !== null ? r.grade.toFixed(1) + '%' : '--'}</td>
        <td style="text-align:center;" class="${colorClass}">${r.letter}</td>
        <td style="text-align:right;">${r.gpa !== null ? r.gpa.toFixed(1) : '--'}</td>
        <td style="text-align:right;">${r.quality ? r.quality.toFixed(2) : '--'}</td>
      </tr>`;
    }).join('');

    $('#gpaTotalCredits').textContent = totalCredits;
    $('#gpaCalculated').textContent = cumulativeGpa !== null ? cumulativeGpa.toFixed(2) : '--';
    $('#gpaTotalQuality').textContent = totalQuality ? totalQuality.toFixed(2) : '0';
  }

  // ===== Academic Programs =====
  const addProgramBtn = $('#addProgramBtn');
  const addProgramModal = $('#addProgramModal');
  const closeAddProgram = $('#closeAddProgram');
  const cancelAddProgram = $('#cancelAddProgram');
  const confirmAddProgram = $('#confirmAddProgram');
  const programsGrid = $('#programsGrid');
  const programsEmpty = $('#programsEmpty');

  addProgramBtn.addEventListener('click', () => {
    clearProgramForm();
    addProgramModal.classList.add('show');
  });
  closeAddProgram.addEventListener('click', () => addProgramModal.classList.remove('show'));
  cancelAddProgram.addEventListener('click', () => addProgramModal.classList.remove('show'));
  addProgramModal.addEventListener('click', (e) => {
    if (e.target === addProgramModal) addProgramModal.classList.remove('show');
  });

  function clearProgramForm() {
    $('#programName').value = '';
    $('#programInstitution').value = '';
    $('#programType').value = '';
    $('#programStartDate').value = '';
    $('#programExpectedEnd').value = '';
    $('#programTotalCredits').value = '';
  }

  confirmAddProgram.addEventListener('click', () => {
    const name = $('#programName').value.trim();
    if (!name) {
      showToast('Please enter a program name.');
      return;
    }

    const program = {
      id: genId(),
      name: name,
      institution: $('#programInstitution').value.trim(),
      type: $('#programType').value,
      startDate: $('#programStartDate').value,
      expectedEnd: $('#programExpectedEnd').value,
      totalCredits: parseFloat($('#programTotalCredits').value) || 0,
    };

    appData.programs.push(program);
    addActivity(`Added program: ${program.name}`);
    saveData();
    renderPrograms();
    addProgramModal.classList.remove('show');
    showToast(`Program "${name}" added.`);
  });

  function renderPrograms() {
    if (!appData.programs.length) {
      programsEmpty.style.display = '';
      // Remove any program cards
      programsGrid.querySelectorAll('.program-card').forEach((el) => el.remove());
      return;
    }

    programsEmpty.style.display = 'none';

    // Clear existing cards
    programsGrid.querySelectorAll('.program-card').forEach((el) => el.remove());

    appData.programs.forEach((prog) => {
      // Calculate earned credits (sum of credits from courses)
      const earnedCredits = appData.courses.reduce((s, c) => {
        const grade = computeOverallGrade(c);
        if (grade !== null && grade >= 60) {
          return s + (parseFloat(c.credits) || 0);
        }
        return s;
      }, 0);

      const progressPct = prog.totalCredits > 0
        ? Math.min(100, (earnedCredits / prog.totalCredits) * 100)
        : 0;

      const card = document.createElement('div');
      card.className = 'program-card';
      card.innerHTML = `
        <div class="program-card-header">
          <div>
            <div class="program-card-title">${escHtml(prog.name)}</div>
            <div class="program-card-institution">${escHtml(prog.institution || 'No institution specified')}</div>
          </div>
          ${prog.type ? `<span class="program-card-type">${escHtml(prog.type)}</span>` : ''}
        </div>
        <div class="program-card-details">
          <div class="program-detail-item">
            <span class="program-detail-label">Start Date</span>
            <span class="program-detail-value">${prog.startDate ? formatDate(prog.startDate) : '--'}</span>
          </div>
          <div class="program-detail-item">
            <span class="program-detail-label">Expected Completion</span>
            <span class="program-detail-value">${prog.expectedEnd ? formatDate(prog.expectedEnd) : '--'}</span>
          </div>
          <div class="program-detail-item">
            <span class="program-detail-label">Total Credits</span>
            <span class="program-detail-value">${prog.totalCredits || '--'}</span>
          </div>
          <div class="program-detail-item">
            <span class="program-detail-label">Earned Credits</span>
            <span class="program-detail-value">${earnedCredits}</span>
          </div>
        </div>
        ${prog.totalCredits > 0 ? `
        <div class="program-progress">
          <div class="program-progress-label">
            <span>Progress</span>
            <span>${progressPct.toFixed(0)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${progressPct}%"></div>
          </div>
        </div>` : ''}
        <div class="program-card-actions">
          <button class="btn btn-outline btn-sm" data-delete-program="${prog.id}">Remove</button>
        </div>
      `;

      programsGrid.appendChild(card);

      card.querySelector(`[data-delete-program="${prog.id}"]`).addEventListener('click', () => {
        if (confirm(`Remove program "${prog.name}"?`)) {
          appData.programs = appData.programs.filter((p) => p.id !== prog.id);
          addActivity(`Removed program: ${prog.name}`);
          saveData();
          renderPrograms();
          showToast('Program removed.');
        }
      });
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ===== Utilities =====
  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ===== Initialize =====
  function init() {
    initSettings();
    refreshCourseSelect();
    refreshDashboard();
    refreshGpa();
    renderPrograms();
  }

  init();
})();
