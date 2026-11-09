import { CalendarDays, Pencil, Trash2 } from 'lucide-react'

function TaskItem({ task, list, onToggle, onEdit, onDelete }) {
  const dueLabel = task.dueDate ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T12:00:00`)) : null

  return <article className={`task-item ${task.completed ? 'is-completed' : ''}`}>
    <button type="button" className="task-check" onClick={() => onToggle(task)} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}><span>{task.completed && <span className="check-glyph">✓</span>}</span></button>
    <button type="button" className="task-copy" onClick={() => onEdit(task)}><strong>{task.title}</strong>{task.note && <small>{task.note}</small>}</button>
    <div className="task-meta">{dueLabel && <span className="due-date"><CalendarDays size={13} />{dueLabel}</span>}{list && <span className="task-list-chip"><i style={{ backgroundColor: list.color }} />{list.name}</span>}</div>
    <div className="task-actions"><button type="button" title="Edit task" onClick={() => onEdit(task)}><Pencil size={14} /></button><button type="button" title="Delete task" onClick={() => onDelete(task.id)}><Trash2 size={14} /></button></div>
  </article>
}

export default TaskItem