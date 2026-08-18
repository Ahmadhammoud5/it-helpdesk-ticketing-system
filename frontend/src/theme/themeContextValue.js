import { createContext } from 'react'

export const THEME_STORAGE_KEY = 'helpdesk-theme'

export const ThemeContext = createContext(null)

export function getPreferredTheme() {
  const initializedTheme =
    document.documentElement.dataset.theme

  if (
    initializedTheme === 'light' ||
    initializedTheme === 'dark'
  ) {
    return initializedTheme
  }

  let savedTheme

  try {
    savedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    )
  } catch {
    savedTheme = null
  }

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches
    ? 'dark'
    : 'light'
}

export function applyTheme(theme) {
  const isDark = theme === 'dark'

  document.documentElement.classList.toggle(
    'dark',
    isDark,
  )
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
