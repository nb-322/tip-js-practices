export default function TaskStats({ stats }) {
  return (
    <section aria-label="Статистика">
      <h2>Статистика</h2>
      <p>
        Всего: <strong data-stat="total">{stats.total}</strong>{' · '}
        Выполнено: <strong data-stat="completed">{stats.completed}</strong>{' · '}
        В работе: <strong data-stat="active">{stats.active}</strong>
      </p>
    </section>
  );
}
