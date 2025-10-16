"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/utils/notify';

export default function Signup() {
    const [name, setName] = useState("");
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
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Signup failed");
            await showSuccess('Account created successfully');
            setName("");
            setEmail("");
            setPassword("");
            router.push('/login');
        } catch (err) {
            await showError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-20 px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Create an Account</h2>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">Join Zibtek to access our AI assistant.</p>

            <form suppressHydrationWarning onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800">
                <input defaultValue={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Full name" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input defaultValue={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input defaultValue={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" disabled={loading} className="mt-2 cursor-pointer px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">{loading ? "Creating..." : "Create Account"}</button>
                {message && <div className={`mt-2 text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>{message.text}</div>}
            </form>
        </div>
    );
}
