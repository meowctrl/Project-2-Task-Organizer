import { useEffect, useState } from 'react'

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.')
  return data
}

async function loadResources() {
  const [listData, taskData, reportData] = await Promise.all([
    request('/api/lists'),
    request('/api/tasks'),
    request('/api/reports'),
  ])
  return { lists: listData.lists, tasks: taskData.tasks, reports: reportData.reports }
}

export function useOrganizerApi() {
  const [user, setUser] = useState(null)
  const [lists, setLists] = useState([])
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const { user: currentUser } = await request('/api/auth/me')
        if (cancelled) return
        setUser(currentUser)
        if (currentUser) {
          const resources = await loadResources()
          if (cancelled) return
          setLists(resources.lists)
          setTasks(resources.tasks)
          setReports(resources.reports)
        }
      } catch (cause) {
        if (!cancelled) setError(cause.message)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [])

  async function run(operation) {
    setLoading(true)
    setError('')
    try {
      return await operation()
    } catch (cause) {
      setError(cause.message)
      throw cause
    } finally {
      setLoading(false)
    }
  }

  async function authenticate(mode, values) {
    return run(async () => {
      const { user: nextUser } = await request(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(values),
      })
      setUser(nextUser)
      const resources = await loadResources()
      setLists(resources.lists)
      setTasks(resources.tasks)
      setReports(resources.reports)
    })
  }

  async function logout() {
    return run(async () => {
      await request('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setLists([])
      setTasks([])
      setReports([])
    })
  }

  async function createList(name) {
    return run(async () => {
      const { list } = await request('/api/lists', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      setLists((current) => [...current, list])
      return list
    })
  }

  async function renameList(id, name) {
    return run(async () => {
      const { list } = await request(`/api/lists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      setLists((current) => current.map((item) => item.id === id ? list : item))
    })
  }

  async function deleteList(id) {
    return run(async () => {
      await request(`/api/lists/${id}`, { method: 'DELETE' })
      setLists((current) => current.filter((list) => list.id !== id))
      setTasks((current) => current.filter((task) => task.listId !== id))
    })
  }

  async function createTask(details) {
    return run(async () => {
      const { task } = await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(details),
      })
      setTasks((current) => [task, ...current])
    })
  }

  async function updateTask(id, changes) {
    return run(async () => {
      const { task } = await request(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      })
      setTasks((current) => current.map((item) => item.id === id ? task : item))
    })
  }

  async function deleteTask(id) {
    return run(async () => {
      await request(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks((current) => current.filter((task) => task.id !== id))
    })
  }

  async function createReport() {
    return run(async () => {
      const { report } = await request('/api/reports', { method: 'POST' })
      setReports((current) => [report, ...current])
    })
  }

  return {
    user, lists, tasks, reports, authLoading, loading, error,
    clearError: () => setError(''), authenticate, logout,
    createList, renameList, deleteList, createTask, updateTask, deleteTask,
    createReport,
  }
}