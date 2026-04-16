"use client";

import { useState } from "react";
import Link from "next/link";

const SUBJECTS = [
  "General question",
  "Feature request",
  "Bug report",
  "Early access",
  "Other",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl =
      `mailto:gavinrgallant@gmail.com` +
      `?subject=${encodeURIComponent(`[DineLinks] ${subject}`)}` +
      `&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
    window.open(mailtoUrl);
    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80)",
          filter: "blur(8px)",
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Logo + card wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Logo mark — links home */}
        <Link href="/" className="flex flex-col items-center no-underline cursor-pointer mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p className="text-white text-xs font-semibold uppercase tracking-widest">DineLinks</p>
        </Link>

        {/* Frosted glass card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl p-8">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-1 text-center">Get in touch</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Have a question, feedback, or want to get early access? We&apos;d love to hear from you.
          </p>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">Message sent!</p>
              <p className="text-sm text-gray-500">We&apos;ll get back to you soon.</p>
              <button
                type="button"
                onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); setSubject(SUBJECTS[0]); }}
                className="mt-5 text-sm text-[#8b6914] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914] resize-y"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#8b6914] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Send message
              </button>
            </form>
          )}

          <p className="text-sm text-center text-gray-500 mt-6">
            Or email us directly at{" "}
            <a href="mailto:gavinrgallant@gmail.com" className="text-[#8b6914] font-medium hover:underline">
              gavinrgallant@gmail.com
            </a>
          </p>
          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
