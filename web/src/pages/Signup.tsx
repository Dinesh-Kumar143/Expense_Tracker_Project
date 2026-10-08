import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Signup() {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setSubmitting(true);
        try {
            await signUp(name, email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.error ?? 'Could not sign up.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Expense Tracker</p>
                <h1 className="mt-1 text-3xl font-extrabold">Create your account</h1>

                {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

                <label className="mt-6 block text-xs font-bold uppercase tracking-wide">Name</label>
                <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                    placeholder="Dinesh Kumar" required
                />

                <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Email</label>
                <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                    placeholder="you@example.com" required
                />

                <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Password</label>
                <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
                    placeholder="At least 8 characters" required
                />

                <button
                    type="submit" disabled={submitting}
                    className="mt-6 w-full rounded-xl bg-accent py-3 font-extrabold text-white disabled:opacity-60"
                >
                    {submitting ? 'Creating account...' : 'Sign up'}
                </button>

                <p className="mt-4 text-center text-sm text-slate-500">
                    Already have an account? <Link to="/login" className="font-bold text-accent">Log in</Link>
                </p>
            </form>
        </div>
    );
}