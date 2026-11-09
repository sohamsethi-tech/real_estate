import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return (
    <div ref={element} className={`reveal${visible ? " is-visible" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}
