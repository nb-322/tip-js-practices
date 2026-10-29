const EMPTY_FILTERS = { q: '', completed: '', priority: '', categoryId: '' };

export default function TaskFilters({ filters, categories, onChange }) {
  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <section aria-label="Фильтры">
      <h2>Фильтры</h2>

      <label htmlFor="filter-q">Поиск по названию</label>
      <input
        id="filter-q"
        type="search"
        value={filters.q}
        onChange={event => update('q', event.target.value)}
      />

      <label htmlFor="filter-completed">Статус</label>
      <select
        id="filter-completed"
        value={filters.completed}
        onChange={event => update('completed', event.target.value)}
      >
        <option value="">Все</option>
        <option value="false">В работе</option>
        <option value="true">Выполненные</option>
      </select>

      <label htmlFor="filter-priority">Приоритет</label>
      <select
        id="filter-priority"
        value={filters.priority}
        onChange={event => update('priority', event.target.value)}
      >
        <option value="">Любой</option>
        <option value="low">Низкий</option>
        <option value="medium">Средний</option>
        <option value="high">Высокий</option>
      </select>

      <label htmlFor="filter-category">Категория</label>
      <select
        id="filter-category"
        value={filters.categoryId}
        onChange={event => update('categoryId', event.target.value)}
      >
        <option value="">Все</option>
        {categories.map(category => (
          <option key={category.id} value={String(category.id)}>{category.name}</option>
        ))}
      </select>

      <div className="actions">
        <button type="button" onClick={() => onChange({ ...EMPTY_FILTERS })}>
          Сбросить фильтры
        </button>
      </div>
    </section>
  );
}
