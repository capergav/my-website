"use client";

export function PoweredByFooter({ fontColor }: { fontColor: string }) {
  return (
    <footer className="py-6 text-center">
      <a
        href="https://dinelinks.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 transition-colors hover:text-[#8b6914]"
        style={{ color: `${fontColor}40`, fontFamily: "system-ui, sans-serif", fontSize: 12 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#8b6914")}
        onMouseLeave={(e) => (e.currentTarget.style.color = `${fontColor}40`)}
      >
        <svg width="12" height="11" viewBox="0 0 44 40" fill="none">
          <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <line x1="26" y1="3" x2="26" y2="37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="37" x2="42" y2="37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span>Powered by DineLinks</span>
      </a>
    </footer>
  );
}
