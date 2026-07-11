import { useState, type FormEvent } from 'react'
import './Auth.css'
import logo from '../assets/logo.png'

type AuthProps = {
    onAuthenticated: (token: string) => void
}

export default function Auth({ onAuthenticated }: AuthProps) {
    const [accessToken, setAccessToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError('')

        const token = accessToken.trim()
        if (!token) {
            setError('Access token is required.')
            return
        }

        setLoading(true)
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
            const response = await fetch(`${apiBase}/reports`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { detail?: string } | null
                throw new Error(payload?.detail ?? 'Invalid token.')
            }

            onAuthenticated(token)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="auth-screen animate-on-load" style={{ ['--order' as any]: 1 }}>
            <div className="auth-container animate-on-load" style={{ ['--order' as any]: 2 }}>
                <div className="auth-brand animate-on-load" style={{ ['--order' as any]: 3 }}>
                    <img src={logo} alt="OpsForge logo" className="auth-logo" />
                    <div>
                        <h2>OpsForge Access</h2>
                        <p className="auth-subtitle">Secure analytics workspace</p>
                    </div>
                </div>

                <p className="auth-copy animate-on-load" style={{ ['--order' as any]: 4 }}>
                    Enter your access token to unlock reports, AI diagnostics, and CSV analysis.
                </p>

                <form onSubmit={handleSubmit} className="animate-on-load" style={{ ['--order' as any]: 5 }}>
                    <label htmlFor="access-token" className="auth-label">Access token</label>
                    <input
                        id="access-token"
                        type="password"
                        placeholder="Access token"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        autoComplete="off"
                    />
                    {error && <p className="error">{error}</p>}
                    <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Enter'}</button>
                </form>

                <div className="auth-note animate-on-load" style={{ ['--order' as any]: 6 }} aria-hidden="true">
                    <span className="auth-note__dot" />
                    Token is verified server-side before any protected data is loaded.
                </div>
            </div>
        </section>
    )
}