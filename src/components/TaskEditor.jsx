import { useState } from 'react'
import { X } from 'lucide-react'

function TaskEditor({ task, lists, onClose, onSave }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setSaving(true)
    setError('')
    try {
      await onSave(task.id, { title: values.title, note: values.note, dueDate: values.dueDate, listId: values.listId })
      onClose()
    } catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="task-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <header className="editor-header"><div><span className="eyebrow">A SMALL STEP</span><h2 id="editor-title">Task details</h2></div><button type="button" className="icon-button" title="Close" onClick={onClose}><X size={18} /></button></header>
      <form className="editor-form" onSubmit={handleSubmit}>
        <label>Task<input name="title" defaultValue={task.title} maxLength="120" autoFocus required /></label>
        <label>Note <span className="optional">OPTIONAL</span><textarea name="note" defaultValue={task.note} rows="3" maxLength="500" placeholder="Add a few helpful details…" /></label>
        <div className="editor-row"><label>Due date<input name="dueDate" type="date" defaultValue={task.dueDate} /></label><label>List<select name="listId" defaultValue={task.listId}>{lists.map((list) => <option value={list.id} key={list.id}>{list.name}</option>)}</select></label></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="editor-actions"><button type="button" className="text-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </section>
  </div>
}

export default TaskEditor