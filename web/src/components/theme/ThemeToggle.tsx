"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type ThemeMode = "light" | "dark";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("theme") as ThemeMode | null;
    return storedTheme ?? getSystemTheme();
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
    >
      <span className={styles.icon}>
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 4.5a1 1 0 0 1 1 1v1.25a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11.75a1 1 0 0 1 1 1v1.25a1 1 0 1 1-2 0V17.25a1 1 0 0 1 1-1Zm7.5-5.25a1 1 0 1 1 0 2h-1.25a1 1 0 1 1 0-2h1.25ZM6.75 12a1 1 0 0 1-1 1H4.5a1 1 0 1 1 0-2h1.25a1 1 0 0 1 1 1Zm9.02-4.77a1 1 0 0 1 1.41 0l.89.88a1 1 0 0 1-1.42 1.42l-.88-.89a1 1 0 0 1 0-1.41Zm-9.84 9.84a1 1 0 0 1 1.41 0l.89.88a1 1 0 1 1-1.42 1.42l-.88-.89a1 1 0 0 1 0-1.41Zm11.26 1.42a1 1 0 0 1-1.42-1.42l.89-.88a1 1 0 1 1 1.42 1.41l-.89.89Zm-9.84-9.84A1 1 0 0 1 5.93 7.23l-.88-.89a1 1 0 1 1 1.41-1.41l.89.88a1 1 0 0 1 0 1.42ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.5 14.25A7.5 7.5 0 0 1 9.75 4.5a8.25 8.25 0 1 0 9.75 9.75Z"
              fill="currentColor"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
