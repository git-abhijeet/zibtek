"use client";

import Link from "next/link";
import { SparklesIcon, ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <section className="w-full max-w-5xl rounded-3xl p-10 sm:p-14 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">

          {/* Left Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="uppercase tracking-wide text-sm font-medium text-indigo-600 dark:text-indigo-400">AI Chatbot</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Smart AI Assistant <br />
              Powered by Zibtek
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 max-w-xl">
              Ask anything about Zibtek. Our AI assistant uses company-specific data to respond accurately, securely, and politely.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="px-6 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
                Get Started
              </Link>
              <Link href="/login" className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                Log In
              </Link>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-md w-full md:w-80">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-indigo-500" />
              Quick Links
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li>🔹 Product Strategy & Consulting</li>
              <li>🔹 UX/UI & Engineering</li>
              <li>🔹 Team Augmentation</li>
              <li>🔹 AI Chatbot Customization</li>
              <li>🔹 Secure Data Integration</li>
            </ul>
          </div>

        </div>
      </section>
    </div>
  );
}
