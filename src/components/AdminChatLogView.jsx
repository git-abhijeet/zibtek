"use client";

import { useEffect, useRef } from "react";

// props.logs: Array<{ when?: string|null, question: string, answer: string, kind?: string }>
export default function AdminChatLogView({ logs }) {
    const containerRef = useRef(null);

    // Auto-scroll to bottom on mount and when logs change
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        // scroll to bottom smoothly
        try {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        } catch {
            el.scrollTop = el.scrollHeight;
        }
    }, [logs]);

    return (
        <div ref={containerRef} className="h-[70vh] overflow-y-auto p-4 space-y-4">
            {logs.map((l, idx) => (
                <div key={idx} className="space-y-2">
                    <div className="flex flex-col gap-1 items-end">
                        {l.when && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(l.when).toLocaleString()}
                            </div>
                        )}
                        {/* User message on the right (first) */}
                        <div className="self-end max-w-[80%] rounded-lg bg-gray-800 text-white px-3 py-2">
                            {l.question}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                        {l.when && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(l.when).toLocaleString()}
                            </div>
                        )}
                        {/* LLM response on the left (second) */}
                        <div className="self-start max-w-[80%] rounded-lg bg-gray-100 dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                            {l.answer}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
