export function getVisibleTasks(tasks, filter = "all") {
    if (filter === "pending") {
        return tasks.filter((task) => task.completed === false);
    }
    if (filter === "completed") {
        return tasks.filter((task) => task.completed === true);
    }
    return [...tasks];
}

export function getTasksByPriority(tasks, priority = "all") {
    if (priority === "low" || priority === "medium" || priority === "high") {
        return tasks.filter((task) => task.priority === priority);
    }
    return [...tasks];
}
