import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  const categoryNames = new Map(categories.map(category => [category.id, category.name]));

  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>Найдено: <strong data-stat="visible">{tasks.length}</strong></p>
      {tasks.length === 0 ? (
        <p>По выбранным условиям задач нет.</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={categoryNames.get(task.categoryId) ?? 'Без категории'}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
