'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const waveRef = useRef<SVGSVGElement>(null);

  // Get active index from pathname
  const getActiveIndex = () => {
    if (pathname === '/' || pathname.startsWith('/day')) return 0;
    if (pathname === '/planner') return 1;
    if (pathname === '/emergency') return 2;
    return 0;
  };

  const activeIndex = getActiveIndex();

  // Align wave on mount and when pathname changes
  useEffect(() => {
    if (!waveRef.current) return;

    // Calculate wave position - account for padding (20px each side)
    const navWidth = waveRef.current.parentElement?.parentElement?.offsetWidth || 390;
    const padding = 40; // 20px on each side
    const usableWidth = navWidth - padding;
    const itemWidth = usableWidth / 3;
    const waveWidth = 150;
    const left = padding / 2 + (activeIndex * itemWidth) + (itemWidth / 2) - (waveWidth / 2);

    waveRef.current.style.left = `${left}px`;
  }, [activeIndex, pathname]);

  const handleClick = (index: number) => {
    if (!waveRef.current) return;

    const navWidth = waveRef.current.parentElement?.parentElement?.offsetWidth || 390;
    const padding = 40;
    const usableWidth = navWidth - padding;
    const itemWidth = usableWidth / 3;
    const waveWidth = 150;
    const left = padding / 2 + (index * itemWidth) + (itemWidth / 2) - (waveWidth / 2);

    waveRef.current.style.left = `${left}px`;
  };

  return (
    <nav className="bottom-nav-container">
      <div className="wave-wrap">
        <svg
          ref={waveRef}
          id="wave"
          viewBox="0 0 119 26"
        >
          <path
            className="path"
            d="M120.8,26C98.1,26,86.4,0,60.4,0C35.9,0,21.1,26,0.5,26H120.8z"
          />
        </svg>
      </div>
      <ul className="list-wrap">
        <li className={activeIndex === 0 ? 'active' : ''} onClick={() => handleClick(0)}>
          <Link href="/">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </Link>
        </li>
        <li className={activeIndex === 1 ? 'active' : ''} onClick={() => handleClick(1)}>
          <Link href="/planner">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </Link>
        </li>
        <li className={activeIndex === 2 ? 'active' : ''} onClick={() => handleClick(2)}>
          <Link href="/emergency">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
