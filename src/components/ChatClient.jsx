"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// Chat UI with dark theme, full-height layout, sticky input, and smooth UX
export default function ChatClient({ userId }) {
    const [messages, setMessages] = useState([
        { role: "bot", content: "Welcome! How can I help you today?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const scrollRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Auto-resize textarea up to a max height
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const max = 140; // ~7 lines depending on line-height
        el.style.height = Math.min(el.scrollHeight, max) + "px";
    }, [input]);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const text = input;
        const userMessage = { role: "user", content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, userId }),
            });
            // Start a placeholder bot message we can append to
            setMessages((prev) => [...prev, { role: "bot", content: "" }]);

            if (!res.ok) {
                // Try to parse error body
                let errText = "Oops! Something went wrong.";
                try {
                    const maybeJson = await res.json();
                    errText = maybeJson?.error || errText;
                } catch {
                    try {
                        errText = await res.text();
                    } catch { }
                }
                setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx]?.role === "bot") {
                        next[lastIdx] = { ...next[lastIdx], content: errText || "Error" };
                    }
                    return next;
                });
                return;
            }

            // Handle streamed text/plain responses
            const reader = res.body?.getReader?.();
            if (reader) {
                const decoder = new TextDecoder();
                // Read until done
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    if (!chunk) continue;
                    setMessages((prev) => {
                        const next = [...prev];
                        const lastIdx = next.length - 1;
                        if (lastIdx >= 0 && next[lastIdx]?.role === "bot") {
                            next[lastIdx] = {
                                ...next[lastIdx],
                                content: (next[lastIdx].content || "") + chunk,
                            };
                        }
                        return next;
                    });
                }
            } else {
                // Fallback for non-streaming environments
                const textResp = await res.text();
                setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx]?.role === "bot") {
                        next[lastIdx] = { ...next[lastIdx], content: textResp };
                    }
                    return next;
                });
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "Oops! Something went wrong." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-[calc(100vh-4rem-6rem)] max-h-[calc(100vh-4rem-6rem)] w-full bg-[#0A0A0A] text-slate-100 flex flex-col rounded-none">
            {/* Messages area - scrollable only here */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3"
            >
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl shadow transition-all duration-200 ease-out animate-[fadeIn_180ms_ease-out] ${msg.role === "user"
                            ? "bg-blue-600 text-white ml-auto rounded-br-sm"
                            : "bg-slate-800 text-slate-100 mr-auto rounded-bl-sm"
                            }`}
                    >
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div className="mr-auto bg-slate-800/80 text-slate-300 px-4 py-2 rounded-2xl rounded-bl-sm shadow animate-pulse">
                        Typing...
                    </div>
                )}
            </div>

            {/* Input area - sticky at bottom, dark theme */}
            <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-[#0A0A0A]">
                <div className="mx-auto max-w-3xl px-3 sm:px-4 py-3">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            className="flex-1 bg-slate-900 text-slate-100 placeholder:text-slate-500 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 resize-none leading-6"
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                        />
                        <button
                            className="shrink-0 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white px-4 py-2 h-10 rounded-xl transition"
                            onClick={handleSend}
                            disabled={!canSend}
                            aria-label="Send message"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
