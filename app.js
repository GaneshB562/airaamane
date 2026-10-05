const todos = [];

function addTodo() {
  const input = document.getElementById("todoInput");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  todos.push(text);
  renderTodos();

  input.value = "";
}

function renderTodos() {
  const list = document.getElementById("todoList");

  list.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${todo}
      <button onclick="deleteTodo(${index})">
        Delete
      </button>
    `;

    list.appendChild(li);
  });
}

function deleteTodo(index) {
  todos.splice(index, 1);
  renderTodos();
}
