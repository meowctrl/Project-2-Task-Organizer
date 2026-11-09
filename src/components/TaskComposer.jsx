import { useState } from 'react'
import { Plus, CornerDownLeft } from 'lucide-react'

function TaskComposer({ onCreate, loading }) {
  const [title, setTitle] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return
    try { await onCreate({ title }); setTitle('') } catch { /* Error is displayed in the main view. */ }
  }

  return <form className="task-composer" onSubmit={handleSubmit}><span className="composer-plus"><Plus size={18} /></span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a task…" aria-label="Task title" maxLength="120" /><button type="submit" aria-label="Add task" disabled={loading || !title.trim()}><span>Add task</span><CornerDownLeft size={14} /></button></form>
}

export default TaskComposer