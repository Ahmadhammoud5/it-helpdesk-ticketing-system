import { useCallback, useMemo, useState } from 'react'

import {
  applyTheme,
  getPreferredTheme,
  THEME_STORAGE_KEY,
  ThemeContext,
} from './themeContextValue'

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const initialTheme = getPreferredTheme()
    applyTheme(initialTheme)
    return initialTheme
  })

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      return
    }

    try {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme,
      )
    } catch {
      // The theme still works for this session when storage is unavailable.
    }
    applyTheme(nextTheme)
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
