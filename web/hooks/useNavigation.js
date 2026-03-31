import { useState, useEffect } from "react";

function readHashKey(NAV) {
  if (typeof window === "undefined") {
    return "dashboard";
  }
  const raw = window.location.hash || "";
  const key = raw.replace("#", "");
  const match = NAV.find((n) => n.key === key);
  return match ? match.key : "dashboard";
}

export function useNavigation(NAV) {
  const [active, setActive] = useState(() => readHashKey(NAV));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onHash = () => setActive(readHashKey(NAV));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [NAV]);

  const onNav = (key) => {
    if (typeof window !== "undefined") {
      window.location.hash = `#${key}`;
    }
    setActive(key);
  };

  return { active, onNav };
}



