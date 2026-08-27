"use client";

export function SageMark({ className = "h-7 w-7", accent = false }: { className?: string; accent?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <rect x="1.2" y="1.2" width="13.6" height="13.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5.2 H9.6 C10.2 5.2 10.2 6.1 9.6 6.1 H6.4 C5.8 6.1 5.8 7 6.4 7 H10.6 C11.2 7 11.2 8.8 10.6 8.8 H5.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.8 11.2 C11.8 11.2 12.8 10.2 12.8 9.2 C11.8 9.2 10.8 10.2 10.8 11.2 Z" className={accent ? "fill-accent" : "fill-current"} fill="currentColor" />
    </svg>
  );
}

export function SageWordmark({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SageMark className="h-7 w-7 shrink-0" accent />
      <span className="font-display text-lg font-bold uppercase tracking-tight leading-none">SAGE</span>
    </div>
  );
}
