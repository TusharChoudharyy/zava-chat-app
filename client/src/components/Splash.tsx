import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";

const ZavaStartupLoader = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zPathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

    // Animate background fade-in
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 });

    // Animate flying lines in
    linesRef.current.forEach((line, i) => {
      tl.fromTo(
        line,
        { opacity: 0, x: i % 2 === 0 ? -200 : 200, rotate: i % 2 === 0 ? -45 : 45 },
        { opacity: 1, x: 0, rotate: 0, duration: 0.5 },
        "-=0.3"
      );
    });

    // Draw the Z stroke
    tl.fromTo(
      zPathRef.current,
      { strokeDasharray: 1000, strokeDashoffset: 1000 },
      { strokeDashoffset: 0, duration: 1.6 },
      "-=0.2"
    );

    // Animate Zava.chat text
    tl.fromTo(
      textRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8 },
      "-=0.4"
    );

    // Auto dismiss and redirect
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.6,
      delay: 1.4,
      onComplete: () => {
        if (containerRef.current) {
          containerRef.current.style.display = "none";
        }
        navigate("/login");
      },
    });
  }, [navigate]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_120%_100%_at_bottom_left,#030917,#102770_100%)]"
    >
      {/* Glowing flying lines */}
      <div className="absolute w-full h-full top-0 left-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            ref={(el) => (linesRef.current[i] = el!)}
            className="absolute w-32 h-0.5 bg-cyan-400 blur-md opacity-0"
            style={{
              top: `${20 + i * 15}%`,
              left: i % 2 === 0 ? "-150px" : "100%",
            }}
          />
        ))}
      </div>

      {/* Z shape SVG */}
      <svg viewBox="0 0 300 300" className="w-52 h-52" fill="none" stroke="url(#glow)" strokeWidth="12">
        <path ref={zPathRef} d="M60 60 H240 L60 240 H240" strokeLinecap="round" />
        <defs>
          <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00baff" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Zava.chat glowing text */}
      <div
        ref={textRef}
        className="text-white text-3xl md:text-4xl mt-6 font-semibold tracking-wider bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(0,255,255,0.6)]"
      >
        Zava.chat
      </div>
    </div>
  );
};

export default ZavaStartupLoader;
