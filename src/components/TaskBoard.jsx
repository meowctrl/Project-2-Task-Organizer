import { useState } from 'react'
import { ArrowDownWideNarrow, Plus } from 'lucide-react'
import TaskComposer from './TaskComposer.jsx'
import TaskItem from './TaskItem.jsx'

function TaskBoard({ tasks, lists, activeView, activeList, loading, onCreate, onToggle, onEdit, onDelete }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const activeTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  return <section className="task-board" aria-label="Task list">
    <TaskComposer onCreate={onCreate} loading={loading} />
    <div className="task-list-header"><span>{activeTasks.length ? 'YOUR TASKS' : 'YOUR TASKS · ALL CLEAR'}</span><button type="button" className={`completed-toggle ${showCompleted ? 'selected' : ''}`} onClick={() => setShowCompleted((value) => !value)}><ArrowDownWideNarrow size={14} /> Completed{completedTasks.length > 0 && <span>{completedTasks.length}</span>}</button></div>
    {activeTasks.length === 0 && !(showCompleted && completedTasks.length > 0) && <div className="empty-state"><span className="empty-illustration"><Plus size={23} /></span><strong>{completedTasks.length ? 'Everything is checked off.' : activeList ? `Nothing in ${activeList.name} yet` : activeView === 'today' ? 'A little breathing room.' : 'You’re all caught up.'}</strong><p>{completedTasks.length ? 'A nice place to pause.' : activeList ? 'Add a small step above to get started.' : 'Add a task above when something comes to mind.'}</p></div>}
    <div className="task-items">{activeTasks.map((task) => <TaskItem key={task.id} task={task} list={lists.find((list) => list.id === task.listId)} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</div>
    {showCompleted && <div className="completed-list">{completedTasks.length ? completedTasks.map((task) => <TaskItem key={task.id} task={task} list={lists.find((list) => list.id === task.listId)} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />) : <p className="no-completed">Completed tasks will find a home here.</p>}</div>}
  </section>
}

export default TaskBoard