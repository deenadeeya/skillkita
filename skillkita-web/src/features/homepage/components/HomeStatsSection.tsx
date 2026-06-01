import { useEffect, useRef, useState } from "react";
import type { HomepageStatsRow } from "../api/homepageApi";
import { useCountUp } from "../hooks/useCountUp";

type StatItem = {
  value: number;
  suffix: string;
  label: string;
};

function StatCard({ value, suffix, label, animate }: StatItem & { animate: boolean }) {
  const display = useCountUp(value, 1600, animate);

  return (
    <div className="text-center">
      <p className="font-heading text-4xl font-bold text-secondary sm:text-5xl lg:text-6xl">
        {display.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-white/90 sm:text-base">{label}</p>
    </div>
  );
}

type Props = {
  stats: HomepageStatsRow;
};

export function HomeStatsSection({ stats }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items: StatItem[] = [
    {
      value: stats.students_value,
      suffix: stats.students_suffix,
      label: stats.students_label,
    },
    {
      value: stats.courses_value,
      suffix: stats.courses_suffix,
      label: stats.courses_label,
    },
    {
      value: stats.partners_value,
      suffix: stats.partners_suffix,
      label: stats.partners_label,
    },
    {
      value: stats.satisfaction_value,
      suffix: stats.satisfaction_suffix,
      label: stats.satisfaction_label,
    },
  ];

  return (
    <section ref={ref} className="mt-12 sm:mt-16">
      <div className="rounded-hero bg-primary px-6 py-12 sm:px-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <StatCard key={item.label} {...item} animate={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
