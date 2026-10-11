
import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-react';

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <article className={`task-card ${task.completed ? 'task-completed' : ''}`}>
      <button
        className={`task-check ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
        aria-label={task.completed ? 'Mark as pending' : 'Mark as completed'}
        title={task.completed ? 'Mark as pending' : 'Mark as completed'}
      >
        {task.completed && <Check size={17} />}
      </button>

      <div className="task-content">
        <h3>{task.title}</h3>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-meta">
          <span className={`priority priority-${task.priority}`}>
            {task.priority || 'medium'}
          </span>

          {formattedDate && (
            <span className="due-date">
              <CalendarDays size={14} />
              {formattedDate}
            </span>
          )}

          <span className="task-status">
            {task.completed ? 'Completed' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="task-actions">
        <button
          className="icon-button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          title="Edit task"
        >
          <Pencil size={17} />
        </button>

        <button
          className="icon-button delete-button"
          onClick={() => onDelete(task)}
          aria-label="Delete task"
          title="Delete task"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
