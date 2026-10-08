"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const s = existing || document.createElement("script");
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In")));
    if (!existing) {
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  });
}

/** Official Google Identity Services button. Hands the ID token to `onCredential`. */
export default function GoogleButton({
  clientId,
  onCredential,
  onError,
  text = "continue_with",
}: {
  clientId: string;
  onCredential: (credential: string) => void;
  onError?: (msg: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp: { credential: string }) => cb.current(resp.credential),
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text,
          width: ref.current.offsetWidth || 360,
        });
      })
      .catch((e) => onError?.(e.message));
    return () => {
      cancelled = true;
    };
  }, [clientId, text, onError]);

  return <div ref={ref} id="google-signin-button" className="w-full flex justify-center min-h-[44px]" />;
}
