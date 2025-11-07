(() => {
  const students = [];

  // Elements
  const form = document.querySelector('#student-form');
  const nameInput = document.querySelector('#student-name');
  const scoreInput = document.querySelector('#student-score');
  const resetFormBtn = document.querySelector('#reset-form');
  const feedback = document.querySelector('#form-feedback');

  const studentList = document.querySelector('#student-list');
  const sortButton = document.querySelector('#sort-students');
  const clearButton = document.querySelector('#clear-students');

  const orderToggle = document.querySelector('#sort-order');
  const orderLabel = document.querySelector('#sort-order-label');
  const rankedList = document.querySelector('#ranked-list');
  const sortSummary = document.querySelector('#sort-summary');

  const EMPTY_LIST_MARKUP = `<tr class="empty-state"><td colspan="4">No students added yet.</td></tr>`;
  const EMPTY_RANKING_MARKUP = `<tr class="empty-state"><td colspan="3">Sorting pending…</td></tr>`;

  function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `student-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function showFeedback(message, type = 'success') {
    feedback.textContent = message;
    feedback.classList.remove('hidden', 'error', 'success');
    feedback.classList.add(type);

    setTimeout(() => {
      feedback.classList.add('hidden');
    }, 2500);
  }

  function resetForm() {
    form.reset();
    nameInput.focus();
  }

  function validateStudent({ name, score }) {
    if (!name || !name.trim()) {
      throw new Error('Please enter the student\'s name.');
    }

    const normalizedScore = Number(score);
    if (Number.isNaN(normalizedScore)) {
      throw new Error('Score must be a number.');
    }
    if (normalizedScore < 0 || normalizedScore > 100) {
      throw new Error('Score must be between 0 and 100.');
    }

    return {
      name: name.trim(),
      score: normalizedScore,
      id: createId(),
      createdAt: Date.now(),
    };
  }

  function bubbleSort(input, order = 'desc') {
    const arr = [...input];
    const n = arr.length;
    let swapped;
    let passes = 0;
    let swaps = 0;

    // Descending by default (high to low)
    const compare = order === 'asc'
      ? (a, b) => a.score > b.score
      : (a, b) => a.score < b.score;

    for (let i = 0; i < n - 1; i += 1) {
      swapped = false;
      passes += 1;
      for (let j = 0; j < n - i - 1; j += 1) {
        if (compare(arr[j], arr[j + 1])) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swapped = true;
          swaps += 1;
        }
      }
      if (!swapped) {
        break;
      }
    }

    return { sorted: arr, passes, swaps };
  }

  function renderStudentRow(student, index) {
    return `
      <tr data-id="${student.id}">
        <td>${index + 1}</td>
        <td>${student.name}</td>
        <td>${student.score}</td>
        <td>
          <button class="icon-btn" data-remove="${student.id}" aria-label="Remove ${student.name}">×</button>
        </td>
      </tr>
    `;
  }

  function renderStudentTable() {
    if (!students.length) {
      studentList.innerHTML = EMPTY_LIST_MARKUP;
      disableActions();
      clearRanking();
      return;
    }

    studentList.innerHTML = students
      .map((student, index) => renderStudentRow(student, index))
      .join('');

    enableActions();
  }

  function renderRanking(sortedStudents, stats) {
    if (!sortedStudents || !sortedStudents.length) {
      clearRanking();
      return;
    }

    rankedList.innerHTML = sortedStudents
      .map((student, index) => `
        <tr>
          <td><span class="badge">${index + 1}</span></td>
          <td>${student.name}</td>
          <td>${student.score}</td>
        </tr>
      `)
      .join('');

    const orderText = orderToggle.checked ? 'High → Low' : 'Low → High';

    sortSummary.classList.remove('hidden');
    sortSummary.innerHTML = `
      <div><strong>Order:</strong> ${orderText}</div>
      <div><strong>Passes:</strong> ${stats.passes}</div>
      <div><strong>Swaps:</strong> ${stats.swaps}</div>
      <div><strong>Total Students:</strong> ${sortedStudents.length}</div>
    `;
  }

  function clearRanking() {
    rankedList.innerHTML = EMPTY_RANKING_MARKUP;
    sortSummary.classList.add('hidden');
    sortSummary.innerHTML = '';
  }

  function disableActions() {
    sortButton.disabled = true;
    clearButton.disabled = true;
  }

  function enableActions() {
    sortButton.disabled = students.length < 2;
    clearButton.disabled = students.length === 0;
  }

  function updateOrderLabel() {
    orderLabel.textContent = orderToggle.checked ? 'High → Low' : 'Low → High';
  }

  function handleSort() {
    if (students.length < 1) {
      clearRanking();
      return;
    }

    const order = orderToggle.checked ? 'desc' : 'asc';
    const { sorted, passes, swaps } = bubbleSort(students, order);
    renderRanking(sorted, { passes, swaps });
  }

  function removeStudent(id) {
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      return;
    }
    const [removed] = students.splice(index, 1);
    renderStudentTable();
    showFeedback(`Removed ${removed.name}.`, 'success');
    clearRanking();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const rawStudent = {
      name: formData.get('name'),
      score: formData.get('score'),
    };

    try {
      const student = validateStudent(rawStudent);
      students.push(student);
      renderStudentTable();
      resetForm();
      showFeedback(`Added ${student.name} with score ${student.score}.`, 'success');
      clearRanking();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  });

  resetFormBtn.addEventListener('click', () => {
    resetForm();
    showFeedback('Form cleared.', 'success');
  });

  studentList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove]');
    if (!button) {
      return;
    }
    const { remove: id } = button.dataset;
    removeStudent(id);
  });

  clearButton.addEventListener('click', () => {
    if (!students.length) {
      return;
    }
    students.splice(0, students.length);
    renderStudentTable();
    clearRanking();
    showFeedback('Student list cleared.', 'success');
  });

  sortButton.addEventListener('click', handleSort);
  orderToggle.addEventListener('change', () => {
    updateOrderLabel();
    handleSort();
  });

  updateOrderLabel();
  renderStudentTable();
})();

