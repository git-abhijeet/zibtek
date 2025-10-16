import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import clientPromise from "@/lib/db.js";
import { getSession } from "@/lib/sessions.js";
import { ObjectId } from "mongodb";

import AdminChatLogView from "@/components/AdminChatLogView.jsx";

export const metadata = {
    title: "Chat Logs | Admin",
};

async function requireAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) redirect("/admin-login");

    const session = await getSession(token);
    if (!session?.userId) redirect("/admin-login");

    const client = await clientPromise;
    const db = client.db();
    let userId;
    try {
        userId = new ObjectId(session.userId);
    } catch {
        redirect("/admin-login");
    }
    const user = await db
        .collection("users")
        .findOne({ _id: userId }, { projection: { _id: 1, email: 1, name: 1, isAdmin: 1 } });
    if (!user || !user.isAdmin) redirect("/admin-login");
    return { db, admin: { id: user._id.toString(), email: user.email, name: user.name } };
}

async function fetchAllUsers(db) {
    const docs = await db
        .collection("users")
        .find({}, { projection: { _id: 1, name: 1, email: 1 } })
        .sort({ name: 1, email: 1 })
        .toArray();
    return docs.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email }));
}

async function fetchUserLogs(db, userId) {
    if (!userId) return [];
    let oid = null;
    try {
        oid = new ObjectId(userId);
    } catch { }
    const query = oid
        ? { $or: [{ userId }, { userId: oid }] }
        : { userId };
    const logs = await db
        .collection("chat_logs")
        .find(query, { projection: { question: 1, answer: 1, createdAt: 1, kind: 1 } })
        .sort({ createdAt: 1 }) // chronological: oldest -> newest
        .limit(2000)
        .toArray();
    return logs.map((l) => ({
        when: l.createdAt ? new Date(l.createdAt).toISOString() : null,
        question: l.question || "",
        answer: l.answer || "",
        kind: l.kind || "qa",
    }));
}

export default async function ChatLogsPage(props) {
    const { searchParams } = props || {};
    const sp = searchParams ? await searchParams : {};
    const { db, admin } = await requireAdmin();
    const users = await fetchAllUsers(db);
    const selectedUserId = sp?.user || "";
    const logs = selectedUserId ? await fetchUserLogs(db, selectedUserId) : [];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-4">
                <h1 className="text-3xl font-bold">Chat Logs</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visible to admins only. Signed in as {admin.name || admin.email}.</p>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Sidebar */}
                <aside className="col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-3">
                    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 font-semibold">Users</div>
                        <ul className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                            {users.map((u) => {
                                const href = `/chat-logs?user=${u.id}`;
                                const active = u.id === selectedUserId;
                                return (
                                    <li key={u.id}>
                                        <Link
                                            href={href}
                                            className={
                                                `block px-4 py-3 cursor-pointer transition ` +
                                                (active
                                                    ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                                                    : "hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-gray-200")
                                            }
                                        >
                                            <div className="font-medium">{u.name || u.email}</div>
                                            {u.name && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </aside>

                {/* Main chat area */}
                <main className="col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-9">
                    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[60vh]">
                        {!selectedUserId ? (
                            <div className="h-[60vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
                                Select a user from the left to view their chat history.
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="h-[60vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
                                No chat logs available for this user.
                            </div>
                        ) : (
                            <AdminChatLogView logs={logs} />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
