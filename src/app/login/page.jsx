"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/utils/notify';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");
            await showSuccess(`Welcome back, ${data.user.name || data.user.email}`);
            setEmail("");
            setPassword("");
            // notify other components that auth changed (so Navbar updates)
            try { window.dispatchEvent(new CustomEvent('zibtek:auth', { detail: { user: data.user } })); } catch (e) { }
            router.push('/home');
        } catch (err) {
            await showError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-20 px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Log In</h2>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">Welcome back. Log in to continue.</p>

            <form suppressHydrationWarning onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800">
                <input defaultValue={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input defaultValue={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" disabled={loading} className="mt-2 cursor-pointer px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">{loading ? "Logging in..." : "Log In"}</button>
                {message && <div className={`mt-2 text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>{message.text}</div>}
            </form>
        </div>
    );
}
