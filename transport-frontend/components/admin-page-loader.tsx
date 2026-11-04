'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AdminPageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress and hide when route change finishes
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Listen to clicks on navigation links
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startProgress = () => {
      setLoading(true);
      setProgress(20);

      // Incrementally advance progress up to 88% while waiting
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) {
            if (interval) clearInterval(interval);
            return prev;
          }
          const increment = Math.max(1, (90 - prev) / 6);
          return Math.min(88, prev + increment);
        });
      }, 120);
    };

    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const dest = new URL(href, window.location.origin);
        const currentPath = window.location.pathname + window.location.search;
        const targetPath = dest.pathname + dest.search;

        // If clicking a link to another page in this origin
        if (dest.origin === window.location.origin && targetPath !== currentPath) {
          startProgress();
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <>
      {/* Top progress bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none transition-opacity duration-300"
        style={{ opacity: loading ? 1 : 0 }}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-primary transition-all duration-200 ease-out relative shadow-[0_0_10px_rgba(59,130,246,0.6)]"
          style={{ width: `${progress}%` }}
        >
          {/* Glowing head pulse */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white/60 blur-[1px]" />
          <div className="absolute right-0 -top-1 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-ping opacity-75" />
        </div>
      </div>

      {/* Floating mini loading badge when transition takes more than a moment */}
      {progress > 30 && (
        <div
          aria-hidden="true"
          className="fixed top-3 right-4 z-[100] flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-md border text-xs font-medium text-slate-700 dark:text-slate-200 backdrop-blur pointer-events-none animate-in fade-in duration-200"
        >
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          <span>Loading...</span>
        </div>
      )}
    </>
  );
}
