const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li data-task-id={task.id}>
      <p className="task-title">{task.title}</p>
      <p>
        {task.completed ? 'Выполнена' : 'В работе'}{' · '}
        {PRIORITY_LABELS[task.priority] ?? task.priority}{' · '}
        {categoryName}
      </p>
      <div className="actions">
        <button type="button" onClick={() => onToggle(task.id)}>
          {task.completed ? 'Вернуть в работу' : 'Отметить выполненной'}
        </button>
        <button type="button" onClick={() => onEdit(task.id)}>Редактировать</button>
        <button type="button" onClick={() => onDelete(task.id)}>Удалить</button>
      </div>
    </li>
  );
}
