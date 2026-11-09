/**
 * Light / dark theme. The initial value is set before first paint by the inline
 * script in BaseLayout (stored choice → system preference). This module handles
 * the toggle and notifies canvases (portrait, orb) via a "themechange" event.
 */
export type Theme = "light" | "dark";
const KEY = "theme";

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function setTheme(theme: Theme, persist = true) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode: theme still applies for this page view */
    }
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#080809" : "#f0f0ee");
  window.dispatchEvent(new CustomEvent<Theme>("themechange", { detail: theme }));
}

export function onThemeChange(cb: (t: Theme) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent<Theme>).detail);
  window.addEventListener("themechange", h);
  return () => window.removeEventListener("themechange", h);
}
