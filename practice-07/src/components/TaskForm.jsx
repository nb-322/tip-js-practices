import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function createDraft(initialTask, categories) {
  if (initialTask) {
    return {
      title: initialTask.title,
      priority: initialTask.priority,
      categoryId: String(initialTask.categoryId),
    };
  }
  return { title: '', priority: 'medium', categoryId: String(categories[0]?.id ?? '') };
}

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createDraft(initialTask, categories));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const editing = Boolean(initialTask);

  const update = (field, value) => setDraft(previous => ({ ...previous, [field]: value }));

  function handleSubmit(event) {
    event.preventDefault();
    setFailure('');

    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) {
      return;
    }

    if (onSave(result.value) !== true) {
      setFailure('Сохранить не удалось: задача больше не существует.');
      return;
    }

    if (!editing) {
      setDraft(createDraft(null, categories));
    }
    setErrors({});
  }

  return (
    <section aria-label="Форма задачи">
      <h2>{editing ? `Редактирование задачи № ${initialTask.id}` : 'Новая задача'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="task-title">Название</label>
        <input
          id="task-title"
          type="text"
          value={draft.title}
          onChange={event => update('title', event.target.value)}
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby="task-title-error"
        />
        <p className="error" id="task-title-error">{errors.title ?? ''}</p>

        <label htmlFor="task-priority">Приоритет</label>
        <select
          id="task-priority"
          value={draft.priority}
          onChange={event => update('priority', event.target.value)}
          aria-invalid={errors.priority ? 'true' : undefined}
          aria-describedby="task-priority-error"
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <p className="error" id="task-priority-error">{errors.priority ?? ''}</p>

        <label htmlFor="task-category">Категория</label>
        <select
          id="task-category"
          value={draft.categoryId}
          onChange={event => update('categoryId', event.target.value)}
          aria-invalid={errors.categoryId ? 'true' : undefined}
          aria-describedby="task-category-error"
        >
          {categories.map(category => (
            <option key={category.id} value={String(category.id)}>{category.name}</option>
          ))}
        </select>
        <p className="error" id="task-category-error">{errors.categoryId ?? ''}</p>

        <p role="alert">{failure}</p>

        <div className="actions">
          <button type="submit">{editing ? 'Сохранить изменения' : 'Добавить задачу'}</button>
          {editing && (
            <button type="button" onClick={onCancel}>Отменить редактирование</button>
          )}
        </div>
      </form>
    </section>
  );
}
