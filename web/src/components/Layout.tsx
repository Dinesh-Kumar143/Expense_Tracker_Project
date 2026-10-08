import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ExpensesProvider } from '../context/ExpensesContext';
import { AccountModal } from './AccountModal';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/insights', label: 'Insights', icon: '📊' },
    { to: '/reports', label: 'Reports', icon: '🧾' },
];

export function Layout() {
    const { user } = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Auto-close the mobile drawer whenever the route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <ExpensesProvider>
            <div className="flex min-h-screen">
                {/* Backdrop, mobile only */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-shrink-0 flex-col border-r border-border bg-surface p-5 transition-transform duration-200 md:sticky md:top-0 md:w-60 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-extrabold">💰 Expense Tracker</p>
                        <button onClick={() => setSidebarOpen(false)} className="text-xl md:hidden" aria-label="Close menu">✕</button>
                    </div>

                    <nav className="mt-8 flex flex-col gap-1">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-accent-soft text-accent' : 'text-primary-light hover:bg-bg'
                                    }`
                                }
                            >
                                <span>{item.icon}</span>{item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{user?.name}</p>
                            <p className="truncate text-xs text-primary-light">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-lg hover:bg-bg"
                            aria-label="Account settings"
                        >
                            ⚙️
                        </button>
                    </div>
                </aside>

                <div className="flex min-h-screen flex-1 flex-col">
                    {/* Mobile-only top bar */}
                    <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
                        <button onClick={() => setSidebarOpen(true)} className="text-xl" aria-label="Open menu">☰</button>
                        <p className="font-extrabold">💰 Expense Tracker</p>
                    </header>

                    <main className="flex-1 p-4 md:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>

            <AccountModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </ExpensesProvider>
    );
}