
"use client";

import { useEffect, useRef, useState } from "react";

export function ResizeObserverComponent({
  children,
  onResize
}: {
  children: React.ReactNode;
  onResize?: (width: number, height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        onResize?.(width, height);
        setKey(prev => prev + 1);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [onResize]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { key }) : child
      )}
    </div>
  );
}