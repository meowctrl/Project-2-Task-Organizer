import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Circle,
  FileText,
  Inbox,
  Layers3,
  ListChecks,
  ListPlus,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

const navigation = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming', icon: Circle },
  { id: 'all', label: 'All tasks', icon: Layers3 },
  { id: 'reports', label: 'Reports', icon: FileText },
]

function Sidebar({
  user,
  lists,
  tasks,
  activeView,
  activeListId,
  onView,
  onList,
  onCreateList,
  onRenameList,
  onDeleteList,
  onLogout,
}) {
  const [listName, setListName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [mobileListsOpen, setMobileListsOpen] = useState(false)

  async function addList(event) {
    event.preventDefault()
    if (!listName.trim()) return

    try {
      await onCreateList(listName)
      setListName('')
      setAdding(false)
    } catch {
      // The API hook displays the error in the main view.
    }
  }

  async function renameList(event, id) {
    event.preventDefault()
    if (!editName.trim()) return

    try {
      await onRenameList(id, editName)
      setEditingId(null)
    } catch {
      // The API hook displays the error in the main view.
    }
  }

  function selectView(view) {
    setMobileListsOpen(false)
    onView(view)
  }

  function selectList(id) {
    setMobileListsOpen(false)
    onList(id)
  }

  return (
    <aside className="sidebar">
      <a className="wordmark sidebar-brand" href="/" aria-label="Daymark home">
        <span className="brand-mark">d</span>
        <span>daymark</span>
        <span className="brand-period">.</span>
      </a>

      <button type="button" className="space-switcher">
        <span className="space-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
        <span className="space-name">
          <strong>{user.name}'s space</strong>
          <small>Personal workspace</small>
        </span>
        <span className="switcher-chevron">⌄</span>
      </button>

      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-caption">YOUR DAY</span>
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-item ${activeView === id && !activeListId ? 'active' : ''}`}
            onClick={() => selectView(id)}
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
            {id === 'today' && (
              <span className="nav-count">
                {tasks.filter((task) => !task.completed).length}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          className={`nav-item mobile-list-nav ${mobileListsOpen ? 'active' : ''}`}
          aria-expanded={mobileListsOpen}
          onClick={() => setMobileListsOpen((value) => !value)}
        >
          <ListChecks size={16} strokeWidth={1.8} />
          <span>Lists</span>
        </button>
      </nav>

      <section className={`list-section ${mobileListsOpen ? 'mobile-open' : ''}`} aria-label="Your lists">
        <div className="list-section-heading">
          <span className="nav-caption">YOUR LISTS</span>
          <button
            type="button"
            title="Add a list"
            className="icon-button tiny"
            onClick={() => setAdding((value) => !value)}
          >
            <Plus size={16} />
          </button>
        </div>

        {lists.map((list, index) => {
          const count = tasks.filter((task) => task.listId === list.id && !task.completed).length
          const Icon = index === 0 ? Inbox : Check

          return (
            <div className={`list-row ${activeListId === list.id ? 'active' : ''}`} key={list.id}>
              {editingId === list.id ? (
                <form className="rename-list-form" onSubmit={(event) => renameList(event, list.id)}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    maxLength="32"
                    aria-label="List name"
                  />
                  <button type="submit" title="Save list name"><Check size={14} /></button>
                </form>
              ) : (
                <>
                  <button type="button" className="list-select" onClick={() => selectList(list.id)}>
                    <Icon size={15} strokeWidth={1.8} />
                    <span>{list.name}</span>
                    <small>{count}</small>
                  </button>
                  <div className="list-actions">
                    <button
                      type="button"
                      title={`Rename ${list.name}`}
                      onClick={() => { setEditingId(list.id); setEditName(list.name) }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button type="button" title={`Delete ${list.name}`} onClick={() => onDeleteList(list.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {adding && (
          <form className="add-list-form" onSubmit={addList}>
            <input
              autoFocus
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder="New list name"
              maxLength="32"
              aria-label="New list name"
            />
            <button type="submit" title="Create list"><ListPlus size={15} /></button>
          </form>
        )}
      </section>

      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-spark">✳</span>
          <p>A little progress<br />is still progress.</p>
        </div>
        <div className="profile-row">
          <span className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="profile-info">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <button type="button" title="Sign out" className="icon-button signout-button" onClick={onLogout}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar