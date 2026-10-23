export type Theme = "light" | "dark";

const KEY = "whosejob.theme";
const EVENT = "whosejob:theme";
const LIGHT = "(prefers-color-scheme: light)";
// Matches --ground in globals.css, for the phone's status bar.
const BAR: Record<Theme, string> = { light: "#ecece6", dark: "#0c0f14" };

function saved(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // Private mode or blocked storage: follow the phone.
  }
  return null;
}

/** The resident's own choice if they made one, otherwise the phone's setting. */
export function readTheme(): Theme {
  return saved() ?? (matchMedia(LIGHT).matches ? "light" : "dark");
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", BAR[theme]));
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Can't remember it: it still applies until the page is closed.
  }
  apply(theme);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeTheme(onChange: () => void) {
  const media = matchMedia(LIGHT);
  // With no saved choice, keep following the phone when its setting changes.
  const onPhoneChange = () => {
    if (!saved()) apply(readTheme());
    onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onPhoneChange);
  media.addEventListener("change", onPhoneChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onPhoneChange);
    media.removeEventListener("change", onPhoneChange);
  };
}

/**
 * Runs in <head> before the first paint, so the page never flashes the other
 * theme. It repeats readTheme() and apply() because no bundle has loaded yet.
 * It also creates the status-bar color tag; made outside React, React leaves it alone.
 */
export const themeScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(KEY)})}catch(e){}
if(t!=="light"&&t!=="dark")t=matchMedia(${JSON.stringify(LIGHT)}).matches?"light":"dark";
document.documentElement.dataset.theme=t;
var c=t==="light"?${JSON.stringify(BAR.light)}:${JSON.stringify(BAR.dark)};
var m=document.createElement("meta");m.name="theme-color";m.content=c;document.head.appendChild(m)})()`;
