// Refuse to render inside someone else's frame (clickjacking). GitHub Pages
// cannot send X-Frame-Options or CSP frame-ancestors, so this is the fallback.
export function guardFraming() {
  if (window.top !== window.self) {
    document.documentElement.replaceChildren()
    try {
      window.top.location = window.self.location.href
    } catch {
      // Cross-origin top: the page is already blanked.
    }
    return false
  }
  return true
}
