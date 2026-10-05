"use strict";

const STORAGE_KEY = "advanced-todo-app.tasks";
const MIN_TASK_LENGTH = 3;
const MAX_TASK_LENGTH = 120;
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);
const VALID_FILTERS = new Set([
  "all",
  "active",
  "completed",
  "overdue",
]);

const elements = {
  form: document.querySelector("#todoForm"),
  todoInput: document.querySelector("#todoInput"),
  priorityInput: document.querySelector("#priorityInput"),
  dueDateInput: document.querySelector("#dueDateInput"),
  inputError: document.querySelector("#inputError"),
  searchInput: document.querySelector("#searchInput"),
  filterInput: document.querySelector("#filterInput"),
  clearCompletedButton: document.querySelector(
    "#clearCompletedButton"
  ),
  todoList: document.querySelector("#todoList"),
  todoTemplate: document.querySelector("#todoTemplate"),
  emptyState: document.querySelector("#emptyState"),
  visibleTaskCount: document.querySelector("#visibleTaskCount"),
  totalCount: document.querySelector("#totalCount"),
  activeCount: document.querySelector("#activeCount"),
  completedCount: document.querySelector("#completedCount"),
  overdueCount: document.querySelector("#overdueCount"),
};

validateRequiredElements();

const state = {
  todos: loadTodos(),
  filter: "all",
  searchTerm: "",
};

function validateRequiredElements() {
  const missingElements = Object.entries(elements)
    .filter(([, element]) => element === null)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    throw new Error(
      `Missing required DOM elements: ${missingElements.join(", ")}`
    );
  }
}

function isValidTodo(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    value.text.trim().length >= MIN_TASK_LENGTH &&
    typeof value.completed === "boolean" &&
    VALID_PRIORITIES.has(value.priority) &&
    (value.dueDate === "" || isValidDateValue(value.dueDate))
  );
}

function loadTodos() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return [];
    }

    const parsedValue = JSON.parse(savedValue);

    if (!Array.isArray(parsedValue)) {
      console.warn("Stored todo data is not an array.");
      return [];
    }

    return parsedValue.filter(isValidTodo);
  } catch (error) {
    console.error("Unable to load saved tasks.", error);
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.todos)
    );
  } catch (error) {
    console.error("Unable to save tasks.", error);
    showInputError(
      "Tasks could not be saved in browser storage."
    );
  }
}

function generateId() {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
  ].join("-");
}

function normalizeTaskName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidDateValue(value) {
  if (typeof value !== "string") {
    return false;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function createTodo(text, priority, dueDate) {
  const timestamp = new Date().toISOString();

  return {
    id: generateId(),
    text,
    priority: VALID_PRIORITIES.has(priority)
      ? priority
      : "medium",
    dueDate: isValidDateValue(dueDate) ? dueDate : "",
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function validateTaskName(taskName, excludedTodoId = null) {
  if (!taskName) {
    return "Enter a task name.";
  }

  if (taskName.length < MIN_TASK_LENGTH) {
    return `Task name must contain at least ${MIN_TASK_LENGTH} characters.`;
  }

  if (taskName.length > MAX_TASK_LENGTH) {
    return `Task name cannot exceed ${MAX_TASK_LENGTH} characters.`;
  }

  const duplicateExists = state.todos.some(
    (todo) =>
      todo.id !== excludedTodoId &&
      todo.text.toLowerCase() === taskName.toLowerCase()
  );

  if (duplicateExists) {
    return "A task with this name already exists.";
  }

  return "";
}

function showInputError(message) {
  elements.inputError.textContent = message;
  elements.todoInput.setAttribute(
    "aria-invalid",
    message ? "true" : "false"
  );
}

function isOverdue(todo) {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  if (!isValidDateValue(todo.dueDate)) {
    return false;
  }

  const dueDate = new Date(`${todo.dueDate}T23:59:59`);

  return dueDate.getTime() < Date.now();
}

function getFilteredTodos() {
  const normalizedSearchTerm = state.searchTerm
    .trim()
    .toLowerCase();

  return state.todos.filter((todo) => {
    const matchesSearch =
      normalizedSearchTerm === "" ||
      todo.text.toLowerCase().includes(normalizedSearchTerm);

    if (!matchesSearch) {
      return false;
    }

    switch (state.filter) {
      case "active":
        return !todo.completed;

      case "completed":
        return todo.completed;

      case "overdue":
        return isOverdue(todo);

      case "all":
      default:
        return true;
    }
  });
}

function formatDueDate(dateValue) {
  if (!dateValue || !isValidDateValue(dateValue)) {
    return "No due date";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function resetForm() {
  elements.form.reset();
  elements.priorityInput.value = "medium";
  showInputError("");
  elements.todoInput.focus();
}

function addTodo(event) {
  event.preventDefault();

  const taskName = normalizeTaskName(
    elements.todoInput.value
  );

  const validationError = validateTaskName(taskName);

  if (validationError) {
    showInputError(validationError);
    elements.todoInput.focus();
    return;
  }

  const todo = createTodo(
    taskName,
    elements.priorityInput.value,
    elements.dueDateInput.value
  );

  state.todos = [todo, ...state.todos];

  saveTodos();
  resetForm();
  render();
}

function toggleTodo(todoId) {
  const todoExists = state.todos.some(
    (todo) => todo.id === todoId
  );

  if (!todoExists) {
    console.warn(`Todo not found: ${todoId}`);
    return;
  }

  state.todos = state.todos.map((todo) =>
    todo.id === todoId
      ? {
          ...todo,
          completed: !todo.completed,
          updatedAt: new Date().toISOString(),
        }
      : todo
  );

  saveTodos();
  render();
}

function editTodo(todoId) {
  const todo = state.todos.find(
    (item) => item.id === todoId
  );

  if (!todo) {
    console.warn(`Todo not found: ${todoId}`);
    return;
  }

  const enteredValue = window.prompt(
    "Update the task name:",
    todo.text
  );

  if (enteredValue === null) {
    return;
  }

  const updatedTaskName = normalizeTaskName(enteredValue);
  const validationError = validateTaskName(
    updatedTaskName,
    todoId
  );

  if (validationError) {
    window.alert(validationError);
    return;
  }

  state.todos = state.todos.map((item) =>
    item.id === todoId
      ? {
          ...item,
          text: updatedTaskName,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveTodos();
  render();
}

function deleteTodo(todoId) {
  const todo = state.todos.find(
    (item) => item.id === todoId
  );

  if (!todo) {
    console.warn(`Todo not found: ${todoId}`);
    return;
  }

  const shouldDelete = window.confirm(
    `Delete "${todo.text}"?`
  );

  if (!shouldDelete) {
    return;
  }

  state.todos = state.todos.filter(
    (item) => item.id !== todoId
  );

  saveTodos();
  render();
}

function clearCompletedTodos() {
  const completedCount = state.todos.filter(
    (todo) => todo.completed
  ).length;

  if (completedCount === 0) {
    return;
  }

  const shouldClear = window.confirm(
    `Delete ${completedCount} completed ${
      completedCount === 1 ? "task" : "tasks"
    }?`
  );

  if (!shouldClear) {
    return;
  }

  state.todos = state.todos.filter(
    (todo) => !todo.completed
  );

  saveTodos();
  render();
}

function createTodoElement(todo) {
  const fragment =
    elements.todoTemplate.content.cloneNode(true);

  const listItem = fragment.querySelector(".todo-item");
  const checkbox = fragment.querySelector(".todo-checkbox");
  const text = fragment.querySelector(".todo-text");
  const priority = fragment.querySelector(".priority-badge");
  const dueDate = fragment.querySelector(".todo-due-date");
  const editButton = fragment.querySelector(".edit-button");
  const deleteButton = fragment.querySelector(
    ".delete-button"
  );

  if (
    !listItem ||
    !checkbox ||
    !text ||
    !priority ||
    !dueDate ||
    !editButton ||
    !deleteButton
  ) {
    throw new Error(
      "Todo template does not contain all required elements."
    );
  }

  listItem.dataset.todoId = todo.id;
  listItem.classList.toggle("completed", todo.completed);
  listItem.classList.toggle("overdue", isOverdue(todo));

  checkbox.checked = todo.completed;
  checkbox.setAttribute(
    "aria-label",
    `${todo.completed ? "Reopen" : "Complete"} ${todo.text}`
  );

  text.textContent = todo.text;

  priority.textContent = todo.priority;
  priority.classList.add(`priority-${todo.priority}`);

  dueDate.textContent = `Due: ${formatDueDate(todo.dueDate)}`;

  checkbox.addEventListener("change", () => {
    toggleTodo(todo.id);
  });

  editButton.addEventListener("click", () => {
    editTodo(todo.id);
  });

  deleteButton.addEventListener("click", () => {
    deleteTodo(todo.id);
  });

  return fragment;
}

function updateStatistics() {
  const totalCount = state.todos.length;

  const completedCount = state.todos.filter(
    (todo) => todo.completed
  ).length;

  const activeCount = totalCount - completedCount;

  const overdueCount = state.todos.filter(
    isOverdue
  ).length;

  elements.totalCount.textContent = String(totalCount);
  elements.activeCount.textContent = String(activeCount);
  elements.completedCount.textContent =
    String(completedCount);
  elements.overdueCount.textContent = String(overdueCount);

  elements.clearCompletedButton.disabled =
    completedCount === 0;
}

function render() {
  const visibleTodos = getFilteredTodos();
  const todoFragments = document.createDocumentFragment();

  for (const todo of visibleTodos) {
    todoFragments.appendChild(createTodoElement(todo));
  }

  elements.todoList.replaceChildren(todoFragments);

  elements.emptyState.hidden = visibleTodos.length > 0;

  const taskLabel =
    visibleTodos.length === 1 ? "task" : "tasks";

  elements.visibleTaskCount.textContent =
    `${visibleTodos.length} ${taskLabel} displayed`;

  updateStatistics();
}

function handleSearchInput(event) {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }

  state.searchTerm = event.target.value;
  render();
}

function handleFilterChange(event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    return;
  }

  const selectedFilter = event.target.value;

  state.filter = VALID_FILTERS.has(selectedFilter)
    ? selectedFilter
    : "all";

  render();
}

elements.form.addEventListener("submit", addTodo);

elements.todoInput.addEventListener("input", () => {
  showInputError("");
});

elements.searchInput.addEventListener(
  "input",
  handleSearchInput
);

elements.filterInput.addEventListener(
  "change",
  handleFilterChange
);

elements.clearCompletedButton.addEventListener(
  "click",
  clearCompletedTodos
);

render();

export {
  normalizeTaskName,
  isValidDateValue,
  createTodo,
  validateTaskName,
  isOverdue,
  formatDueDate,
  getFilteredTodos,
  state,
};
