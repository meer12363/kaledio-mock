// Hook-free so the server-rendered root layout can import it.

export const THEME_KEY = "kaledio.theme";

/** Runs in <head> before first paint. Dark is the default. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}})()`;
