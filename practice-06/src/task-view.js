const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function createActionButton(action, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;

    const caption = document.createElement("span");
    caption.className = "action-label";
    caption.textContent = label;
    button.append(caption);

    return button;
}

export function createTaskElement(task, category) {
    const card = document.createElement("li");
    card.className = "task-card";
    card.dataset.taskId = String(task.id);
    if (task.completed) {
        card.classList.add("is-completed");
    }

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = task.completed ? "Выполнена" : "В работе";

    const priority = document.createElement("span");
    priority.className = "task-priority";
    priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

    const categoryName = document.createElement("span");
    categoryName.className = "task-category";
    categoryName.textContent = category?.name ?? "Без категории";

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.append(status, priority, categoryName);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
        createActionButton("toggle", task.completed ? "Вернуть в работу" : "Выполнена"),
        createActionButton("edit", "Изменить"),
        createActionButton("delete", "Удалить"),
    );

    card.append(title, meta, actions);

    return card;
}

export function renderTaskList(list, tasks, categories) {
    const byId = new Map((categories ?? []).map((category) => [category.id, category]));
    list.replaceChildren(
        ...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))),
    );
}
