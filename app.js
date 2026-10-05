"use strict";

const STORAGE_KEY = "advanced-todo-app.tasks";

const state = {
  todos: loadTodos(),
  filter: "all",
  searchTerm: "",
};

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

function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);

    if (!savedTodos) {
      return [];
    }

    const parsedTodos = JSON.parse(savedTodos);

    return Array.isArray(parsedTodos) ? parsedTodos : [];
  } catch (error) {
    console.error("Unable to load saved tasks:", error);
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
    console.error("Unable to save tasks:", error);
  }
}

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTodo(text, priority, dueDate) {
  return {
    id: generateId(),
    text,
    priority,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function isOverdue(todo) {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  const dueDate = new Date(`${todo.dueDate}T23:59:59`);
  return dueDate.getTime() < Date.now();
}

function getFilteredTodos() {
  const normalizedSearch = state.searchTerm
    .trim()
    .toLowerCase();

  return state.todos.filter((todo) => {
    const matchesSearch = todo.text
      .toLowerCase()
      .includes(normalizedSearch);

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
  if (!dateValue) {
    return "No due date";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function validateTaskName(taskName) {
  if (!taskName) {
    return "Enter a task name.";
  }

  if (taskName.length < 3) {
    return "Task name must contain at least 3 characters.";
  }

  if (taskName.length > 120) {
    return "Task name cannot exceed 120 characters.";
  }

  return "";
}

function addTodo(event) {
  event.preventDefault();

  const taskName = elements.todoInput.value.trim();
  const validationError = validateTaskName(taskName);

  elements.inputError.textContent = validationError;

  if (validationError) {
    elements.todoInput.focus();
    return;
  }

  const todo = createTodo(
    taskName,
    elements.priorityInput.value,
    elements.dueDateInput.value
  );

  state.todos.unshift(todo);

  saveTodos();
  resetForm();
  render();
}

function resetForm() {
  elements.form.reset();
  elements.priorityInput.value = "medium";
  elements.inputError.textContent = "";
  elements.todoInput.focus();
}

function toggleTodo(todoId) {
  const todo = state.todos.find((item) => item.id === todoId);

  if (!todo) {
    return;
  }

  todo.completed = !todo.completed;
  todo.updatedAt = new Date().toISOString();

  saveTodos();
  render();
}

function editTodo(todoId) {
  const todo = state.todos.find((item) => item.id === todoId);

  if (!todo) {
    return;
  }

  const newTaskName = window.prompt(
    "Update the task name:",
    todo.text
  );

  if (newTaskName === null) {
    return;
  }

  const trimmedName = newTaskName.trim();
  const validationError = validateTaskName(trimmedName);

  if (validationError) {
    window.alert(validationError);
    return;
  }

  todo.text = trimmedName;
  todo.updatedAt = new Date().toISOString();

  saveTodos();
  render();
}

function deleteTodo(todoId) {
  const todo = state.todos.find((item) => item.id === todoId);

  if (!todo) {
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
  const completedTodos = state.todos.filter(
    (todo) => todo.completed
  );

  if (completedTodos.length === 0) {
    return;
  }

  const shouldClear = window.confirm(
    `Delete ${completedTodos.length} completed task(s)?`
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
  const fragment = elements.todoTemplate.content.cloneNode(true);

  const listItem = fragment.querySelector(".todo-item");
  const checkbox = fragment.querySelector(".todo-checkbox");
  const text = fragment.querySelector(".todo-text");
  const priority = fragment.querySelector(".priority-badge");
  const dueDate = fragment.querySelector(".todo-due-date");
  const editButton = fragment.querySelector(".edit-button");
  const deleteButton = fragment.querySelector(".delete-button");

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
  const total = state.todos.length;
  const completed = state.todos.filter(
    (todo) => todo.completed
  ).length;
  const active = total - completed;
  const overdue = state.todos.filter(isOverdue).length;

  elements.totalCount.textContent = String(total);
  elements.activeCount.textContent = String(active);
  elements.completedCount.textContent = String(completed);
  elements.overdueCount.textContent = String(overdue);

  elements.clearCompletedButton.disabled = completed === 0;
}

function render() {
  const visibleTodos = getFilteredTodos();

  elements.todoList.replaceChildren();

  visibleTodos.forEach((todo) => {
    elements.todoList.appendChild(createTodoElement(todo));
  });

  elements.emptyState.hidden = visibleTodos.length > 0;

  const taskLabel = visibleTodos.length === 1
    ? "task"
    : "tasks";

  elements.visibleTaskCount.textContent =
    `${visibleTodos.length} ${taskLabel} displayed`;

  updateStatistics();
}

elements.form.addEventListener("submit", addTodo);

elements.todoInput.addEventListener("input", () => {
  elements.inputError.textContent = "";
});

elements.searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  render();
});

elements.filterInput.addEventListener("change", (event) => {
  state.filter = event.target.value;
  render();
});

elements.clearCompletedButton.addEventListener(
  "click",
  clearCompletedTodos
);

render();
`
