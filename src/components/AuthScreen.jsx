import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

function AuthScreen({ onAuthenticate, loading, error, clearError }) {
  const [mode, setMode] = useState('login')
  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try { await onAuthenticate(mode, values) } catch { /* The hook exposes the API error. */ }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    clearError()
  }

  return (
    <main className="auth-page">
      <div className="auth-topline"><a className="wordmark" href="/" aria-label="Daymark home"><span className="brand-mark">d</span><span>daymark</span></a><span className="topline-note">A quieter place to get things done</span></div>
      <div className="auth-layout">
        <section className="auth-intro">
          <span className="eyebrow">Make space for what matters</span>
          <h1>Small steps.<br /><em>Clear mind.</em></h1>
          <p>A simple home for all the things you want to get done. No noise, just a little more room to think.</p>
          <div className="auth-check"><span><Check size={14} /></span> Your work stays yours</div>
          <div className="auth-art" aria-hidden="true"><div className="sun-disc" /><div className="art-paper"><span /><span /><span /></div><div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" /></div>
        </section>
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-panel-heading"><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h2 id="auth-title">{isSignup ? 'Create your space' : 'Welcome back'}</h2><p>{isSignup ? 'A fresh start is just one small step away.' : 'Pick up right where you left off.'}</p></div>
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && <label>Your name<input name="name" type="text" placeholder="Alex Morgan" autoComplete="name" minLength="2" maxLength="50" required /></label>}
            <label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" placeholder="At least 8 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength="8" required /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="primary-button auth-submit" disabled={loading}>{loading ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}<ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">{isSignup ? 'Already have a space?' : 'New around here?'} <button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in' : 'Create an account'}</button></p>
          <p className="auth-privacy">By continuing, you agree to keep it simple and be kind to your future self.</p>
        </section>
      </div>
      <footer className="auth-footer"><span>DAYMARK · ONE THING AT A TIME</span><span>Made for the days in between</span></footer>
    </main>
  )
}

export default AuthScreen