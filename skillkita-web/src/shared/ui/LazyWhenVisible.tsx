import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Placeholder while off-screen or before intersection. */
  fallback?: ReactNode;
  rootMargin?: string;
};

/**
 * Mount children only when the placeholder enters (or nears) the viewport.
 * Keeps heavy iframes/embeds off the critical path on long pages.
 */
export function LazyWhenVisible({
  children,
  fallback = null,
  rootMargin = "200px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}
