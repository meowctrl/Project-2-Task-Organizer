import { FileText, Plus } from 'lucide-react'

function ReportEntry({ report }) {
  const response = report.response
  const createdAt = new Date(report.createdAt).toLocaleString()

  return (
    <article className="report-entry">
      <header className="report-title">
        <h2>{report.title}</h2>
        <span>{createdAt}</span>
      </header>
      <div className="report-stats">
        <div><strong>{response.totalTasks}</strong><span>Total tasks</span></div>
        <div><strong>{response.openTasks}</strong><span>Open</span></div>
        <div><strong>{response.completedTasks}</strong><span>Completed</span></div>
        <div><strong>{response.dueToday}</strong><span>Due today</span></div>
      </div>
      <ul className="report-list-breakdown">
        {response.lists.map((list) => (
          <li key={list.id}><span>{list.name}</span><small>{list.openTasks} open</small></li>
        ))}
      </ul>
    </article>
  )
}

function ReportCenter({ reports, loading, onGenerate }) {
  async function generateReport() {
    try {
      await onGenerate()
    } catch {
      // The API hook displays the error in the main view.
    }
  }

  return (
    <section className="report-center" aria-label="Saved productivity recaps">
      <div className="report-toolbar">
        <p>Generate and save a snapshot from your current tasks and lists.</p>
        <button type="button" className="primary-button" onClick={generateReport} disabled={loading}>
          <Plus size={15} />{loading ? 'Generating…' : 'Generate recap'}
        </button>
      </div>
      {reports.length ? (
        <div className="report-list">
          {reports.map((report) => <ReportEntry key={report.id} report={report} />)}
        </div>
      ) : (
        <div className="report-empty">
          <span><FileText size={19} /></span>
          <strong>No saved recaps yet.</strong>
          <p>Generate one to keep a point-in-time summary of your tasks.</p>
        </div>
      )}
    </section>
  )
}

export default ReportCenter