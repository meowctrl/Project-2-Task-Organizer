import { useState } from 'react'
import { Check, CircleHelp, LogOut } from 'lucide-react'
import AuthScreen from './components/AuthScreen.jsx'
import Sidebar from './components/Sidebar.jsx'
import TaskBoard from './components/TaskBoard.jsx'
import TaskEditor from './components/TaskEditor.jsx'
import ReportCenter from './components/ReportCenter.jsx'
import { useOrganizerApi } from './hooks/useOrganizerApi.js'
import './App.css'
import './Organizer.css'

const views = {
  today: { eyebrow: 'A little focus goes a long way', title: 'Today' },
  upcoming: { eyebrow: 'Make room for what is next', title: 'Coming up' },
  all: { eyebrow: 'Everything, in one place', title: 'All tasks' },
  reports: { eyebrow: 'A snapshot of your progress', title: 'Recaps' },
}

function App() {
  const api = useOrganizerApi()
  const [renderDate] = useState(() => new Date())
  const [activeView, setActiveView] = useState('today')
  const [activeListId, setActiveListId] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  const today = renderDate.toISOString().slice(0, 10)
  const visibleTasks = api.tasks.filter((task) => {
    if (activeListId && task.listId !== activeListId) return false
    if (activeView === 'today') return !task.completed && (!task.dueDate || task.dueDate <= today)
    if (activeView === 'upcoming') return !task.completed && task.dueDate > today
    return true
  })

  if (api.authLoading) return <div className="boot-screen"><span className="brand-mark">d</span></div>
  if (!api.user) return <AuthScreen onAuthenticate={api.authenticate} loading={api.loading} error={api.error} clearError={api.clearError} />

  const selectedList = api.lists.find((list) => list.id === activeListId)
  const heading = selectedList ? { eyebrow: 'A space of your own', title: selectedList.name } : views[activeView]
  const completedCount = visibleTasks.filter((task) => task.completed).length
  const openCount = visibleTasks.length - completedCount

  async function createTask(details) {
    await api.createTask({ ...details, listId: activeListId || api.lists[0]?.id })
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={api.user}
        lists={api.lists}
        tasks={api.tasks}
        activeView={activeView}
        activeListId={activeListId}
        onView={(view) => { setActiveView(view); setActiveListId(null) }}
        onList={(listId) => { setActiveListId(listId); setActiveView('all') }}
        onCreateList={api.createList}
        onRenameList={api.renameList}
        onDeleteList={async (id) => {
          if (window.confirm('Delete this list and all its tasks?')) {
            await api.deleteList(id)
            if (activeListId === id) setActiveListId(null)
          }
        }}
        onLogout={api.logout}
      />
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>My space</span><span className="crumb-divider">/</span><strong>{heading.title}</strong></div>
          <div className="topbar-actions"><button type="button" className="icon-button mobile-logout" title="Sign out" onClick={api.logout}><LogOut size={16} /></button><button type="button" className="icon-button help-button" title="About this workspace" onClick={() => window.alert('Task Organizer keeps your lists and tasks together, with private sign-in for your space.')}><CircleHelp size={17} /></button></div>
        </header>
        <section className="board-content">
          <div className="board-heading">
            <div><span className="eyebrow">{heading.eyebrow}</span><h1>{heading.title}<span className="heading-period">.</span></h1><p className="task-summary">{openCount} open {openCount === 1 ? 'task' : 'tasks'}{completedCount ? ` · ${completedCount} completed` : ''}</p></div>
            <div className="date-stamp"><span>{new Intl.DateTimeFormat('en', { weekday: 'long' }).format(renderDate)}</span><strong>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(renderDate)}</strong></div>
          </div>
          {api.error && <div role="alert" className="inline-error"><span>{api.error}</span><button type="button" onClick={api.clearError} aria-label="Dismiss error">×</button></div>}
          {activeView === 'reports' ? (
            <ReportCenter
              reports={api.reports}
              loading={api.loading}
              onGenerate={api.createReport}
            />
          ) : (
            <TaskBoard tasks={visibleTasks} lists={api.lists} activeView={activeView} activeList={selectedList} loading={api.loading} onCreate={createTask} onToggle={(task) => api.updateTask(task.id, { completed: !task.completed })} onEdit={setEditingTask} onDelete={api.deleteTask} />
          )}
          <footer className="board-footer"><span><Check size={14} /> Your progress is saved automatically</span><span>One thing at a time</span></footer>
        </section>
      </main>
      {editingTask && <TaskEditor task={editingTask} lists={api.lists} onClose={() => setEditingTask(null)} onSave={api.updateTask} />}
    </div>
  )
}

export default App
