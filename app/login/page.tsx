'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-page {
          min-height: 100vh;
          background: #0a1628;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }
        .login-card {
          background: #0d1e35;
          border: 1px solid #1a2a3f;
          border-radius: 16px;
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
        }
        .login-logo {
          width: 44px;
          height: 44px;
          background: #2563eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 1.5rem;
        }
        .login-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 0.375rem;
        }
        .login-sub {
          font-size: 0.875rem;
          color: #4a6080;
          margin-bottom: 2rem;
        }
        .field-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4a6080;
          margin-bottom: 0.375rem;
        }
        .dark-input {
          width: 100%;
          background: #0a1628;
          border: 1px solid #1a2a3f;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: #c8d3e0;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
          margin-bottom: 1rem;
        }
        .dark-input:focus { outline: none; border-color: #3b82f6; }
        .dark-input::placeholder { color: #2a3a4f; }
        .login-btn {
          width: 100%;
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
          margin-top: 0.5rem;
        }
        .login-btn:hover { background: #1d4ed8; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error-msg {
          background: #450a0a;
          color: #fca5a5;
          font-size: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🔧</div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-sub">Sign in to your maintenance dashboard</p>

          {error && <div className="error-msg">{error}</div>}

          <label className="field-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="dark-input"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          <label className="field-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="dark-input"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          <button onClick={handleLogin} disabled={loading} className="login-btn">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </>
  )
}
