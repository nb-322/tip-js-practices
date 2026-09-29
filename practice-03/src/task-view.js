import { getTaskStats } from "./task-service.js";

const PRIORITY_LABELS = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
};

function createActionButton(action, label, pressed) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    if (pressed !== undefined) {
        button.setAttribute("aria-pressed", String(pressed));
    }

    const caption = document.createElement("span");
    caption.className = "action-label";
    caption.textContent = label;
    button.append(caption);

    return button;
}

export function createTaskElement(task) {
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

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
        createActionButton("toggle", "Выполнена", task.completed),
        createActionButton("delete", "Удалить")
    );

    card.append(title, status, priority, actions);

    return card;
}

export function renderTaskList(listElement, tasks) {
    listElement.replaceChildren(...tasks.map((task) => createTaskElement(task)));
}

export function renderSummary(summaryElement, tasks, visibleCount) {
    const { total, completed, pending, progress } = getTaskStats(tasks);
    const values = {
        total: String(total),
        completed: String(completed),
        pending: String(pending),
        progress: `${progress.toFixed(1)}%`,
        visible: String(visibleCount),
    };

    for (const [name, value] of Object.entries(values)) {
        const node = summaryElement.querySelector(`[data-stat="${name}"]`);
        if (node !== null) {
            node.textContent = value;
        }
    }
}

export function renderEmptyState(messageElement, total, visibleCount) {
    if (visibleCount > 0) {
        messageElement.textContent = "";
        messageElement.hidden = true;
        return;
    }

    messageElement.textContent = total === 0
        ? "Список задач пуст."
        : "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
}
