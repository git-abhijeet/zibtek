"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/utils/notify";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Admin login failed");

            await showSuccess(`Welcome, ${data.admin?.name || data.admin?.email || 'admin'}`);
            setEmail("");
            setPassword("");
            try { window.dispatchEvent(new CustomEvent('zibtek:auth', { detail: { user: data.admin } })); } catch (e) { }
            router.push("/chat-logs");
        } catch (err) {
            showError(err.message || "Admin login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-20 px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Admin Login</h2>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">Restricted access for Zibtek administrators.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800">
                <input defaultValue={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Admin email" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-gray-800" />
                <input defaultValue={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-gray-800" />
                <button type="submit" disabled={loading} className="mt-2 cursor-pointer px-6 py-3 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition">{loading ? "Signing in..." : "Sign In"}</button>
            </form>
        </div>
    );
}
