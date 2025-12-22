'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: '.hero-container',
            start: 'top top',
            end: '+=150%',
            pin: true,
            scrub: 1,
          },
        })
        .to('.hero__cover-img', {
          scale: 2,
          z: 350,
          transformOrigin: 'center center',
          ease: 'power1.inOut',
        })
        .to(
          '.hero__cover',
          {
            '--overlay-opacity': 0,
            ease: 'power1.inOut',
          },
          '<'
        )
        .to(
          '.hero__bg',
          {
            scale: 1.1,
            filter: 'blur(0px) brightness(1)',
            ease: 'power1.inOut',
          },
          '<'
        )
        .to(
          '.hero__title',
          {
            scale: 1,
            xPercent: -50,
            yPercent: -50,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'power1.inOut',
          },
          '<'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <div className="hero-container" ref={heroRef}>
        <section className="hero">
          <div className="hero__content">
            <div
              className="hero__bg"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=80')`,
              }}
            />
            <h1 className="hero__title">
              New Zealand
              <br />
              <span className="text-blue-400">Adventure 2025</span>
            </h1>
          </div>
          <div className="hero__cover">
            <img
              className="hero__cover-img"
              src="https://images.unsplash.com/photo-1578271887552-5ac3a72752bc?w=1920&q=80"
              alt="Hobbit hole door"
            />
          </div>
        </section>
        <div className="scroll-indicator">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
