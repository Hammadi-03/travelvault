import { useEffect } from 'react'

export function useDarkMode() {
  useEffect(() => {
    // Always use light mode - remove dark class and set to light
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }, [])

  // Always return false for dark mode, no-op for toggle
  return { isDark: false, toggle: () => {}, setIsDark: () => {} }
}
