import { useCallback, useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number>(0);

  const getDecimalPlaces = useCallback((num: number): number => {
    const str = num.toString();
    if (str.includes(".")) {
      const decimals = str.split(".")[1];
      if (parseInt(decimals, 10) !== 0) {
        return decimals.length;
      }
    }
    return 0;
  }, []);

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (value: number) => {
      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      const formatted = Intl.NumberFormat("en-US", options).format(value);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = formatValue(direction === "down" ? to : from);
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (!startWhen || !ref.current) return;

    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setStarted(true);
      },
      { threshold: 0.1, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startWhen]);

  useEffect(() => {
    if (!started) return;

    if (typeof onStart === "function") onStart();

    const startVal = direction === "down" ? to : from;
    const endVal = direction === "down" ? from : to;
    const startTime = performance.now();

    const timeoutId = setTimeout(() => {
      const animate = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = startVal + (endVal - startVal) * eased;

        if (ref.current) {
          ref.current.textContent = formatValue(Math.round(current * 10 ** maxDecimals) / 10 ** maxDecimals);
        }

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          if (ref.current) ref.current.textContent = formatValue(endVal);
          if (typeof onEnd === "function") onEnd();
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [started, from, to, direction, delay, duration, formatValue, maxDecimals, onStart, onEnd]);

  return <span className={className} ref={ref} />;
}
