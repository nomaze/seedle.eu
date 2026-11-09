/** Vector crop symbols conforming to the line-art icon style. */
export function MaisIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3c2.2 0 3.6 2.6 3.6 6.5S14.2 17 12 17s-3.6-3.6-3.6-7.5S9.8 3 12 3Z" />
      <path d="M10 7.5h4M9.6 10.5h4.8M10 13.5h4" />
      <path d="M12 17v4M12 17c-2.5.3-5-1.2-6-4 2.4-.2 4.6.8 6 2.6M12 17c2.5.3 5-1.2 6-4-2.4-.2-4.6.8-6 2.6" />
    </svg>
  );
}

export function KornIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 4c3 0 5 3.5 5 8s-2 8-5 8-5-3.5-5-8 2-8 5-8Z" />
      <path d="M12 8v8" />
    </svg>
  );
}

export function SiloIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 21V9a6 6 0 0 1 12 0v12" />
      <path d="M4 21h16M6 13h12M6 17h12" />
    </svg>
  );
}
