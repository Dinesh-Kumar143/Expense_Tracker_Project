import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.error ?? 'Could not log in.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Expense Tracker</p>
                <h1 className="mt-1 text-3xl font-extrabold">Welcome back</h1>

                {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

                <label className="mt-6 block text-xs font-bold uppercase tracking-wide">Email</label>
                <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                    placeholder="you@example.com" required
                />

                <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Password</label>
                <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                    placeholder="••••••••" required
                />

                <button
                    type="submit" disabled={submitting}
                    className="mt-6 w-full rounded-xl bg-accent py-3 font-extrabold text-white disabled:opacity-60"
                >
                    {submitting ? 'Logging in...' : 'Log in'}
                </button>

                <p className="mt-4 text-center text-sm text-slate-500">
                    Don't have an account? <Link to="/signup" className="font-bold text-accent">Sign up</Link>
                </p>
            </form>
        </div>
    );
}