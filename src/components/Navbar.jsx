"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                if (!mounted) return;
                if (!res.ok) {
                    setUser(null);
                    return;
                }
                const payload = await res.json();
                setUser(payload.user || null);
            } catch (e) {
                if (mounted) setUser(null);
            }
        })();
        // listen for auth change events (dispatched after login/logout) so navbar updates immediately
        const onAuth = async (ev) => {
            if (ev?.detail?.user) {
                setUser(ev.detail.user);
                return;
            }
            // otherwise re-fetch me
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                if (!res.ok) return setUser(null);
                const payload = await res.json();
                setUser(payload.user || null);
            } catch (e) {
                setUser(null);
            }
        };
        window.addEventListener('zibtek:auth', onAuth);

        return () => {
            mounted = false;
            window.removeEventListener('zibtek:auth', onAuth);
        };
    }, []);

    async function handleLogout() {
        setLoading(true);
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'include' });
            setUser(null);
            try { window.dispatchEvent(new CustomEvent('zibtek:auth', { detail: { user: null } })); } catch (e) { }
            router.push('/');
        } catch (e) {
            console.error('Logout failed', e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo */}
                <Link
                    href="/"
                    className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hover:opacity-90 transition"
                >
                    Zibtek
                </Link>

                {/* Nav Buttons */}
                <nav className="flex items-center gap-2 sm:gap-3">
                    {!user ? (
                        <>
                            <Link
                                href="/signup"
                                className="text-sm px-4 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                Sign Up
                            </Link>
                            <Link
                                href="/login"
                                className="text-sm px-4 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/admin-login"
                                className="text-sm px-4 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700 transition"
                            >
                                Admin
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-sm px-4 py-2 rounded-md text-slate-700 dark:text-slate-200">{user.name || user.email}</span>
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="text-sm px-4 py-2 cursor-pointer rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                            >
                                {loading ? 'Signing out...' : 'Logout'}
                            </button>
                        </>
                    )}

                </nav>
            </div>
        </header>
    );
}
