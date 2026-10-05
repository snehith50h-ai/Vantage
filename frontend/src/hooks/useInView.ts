"use client";

import { useState, useEffect, useRef, MutableRefObject } from 'react';

export function useInView<T extends Element = Element>(options = {}): [MutableRefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
      ...options
    });

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isInView];
}
