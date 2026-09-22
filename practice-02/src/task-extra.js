export function getPrioritySummary(tasks) {
    const summary = {
        low: { total: 0, pending: 0 },
        medium: { total: 0, pending: 0 },
        high: { total: 0, pending: 0 },
    };

    for (const task of tasks) {
        const group = summary[task.priority];
        group.total += 1;
        if (task.completed === false) {
            group.pending += 1;
        }
    }

    return summary;
}
