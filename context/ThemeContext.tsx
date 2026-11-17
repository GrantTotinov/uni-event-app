// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper'
import Colors from '@/data/Colors'

const lightTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.PRIMARY,
    primaryContainer: '#d7f0ec',
    onPrimaryContainer: '#0b3d36',
    secondary: Colors.DARK_GRAY,
    secondaryContainer: '#dde8ec',
    onSecondaryContainer: '#14262e',
    tertiary: Colors.ACCENT,
    tertiaryContainer: '#fde3cf',
    background: '#f4f7f6',
    surface: '#ffffff',
    surfaceVariant: '#eaf1ef',
    onSurface: '#14211f',
    onSurfaceVariant: '#55635f',
    outline: '#c4d1cd',
    outlineVariant: '#dfe7e4',
  },
}

const darkTheme = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4fc3b3',
    onPrimary: '#00201c',
    primaryContainer: '#123f3a',
    onPrimaryContainer: '#b3ece2',
    secondary: '#9cc3d0',
    secondaryContainer: '#22414d',
    onSecondaryContainer: '#cfe6ee',
    tertiary: Colors.ACCENT,
    tertiaryContainer: '#5a3519',
    background: '#0e1513',
    surface: '#161f1d',
    surfaceVariant: '#22302d',
    onSurface: '#e3ece9',
    onSurfaceVariant: '#a5b5b0',
    outline: '#3c4c48',
    outlineVariant: '#2a3633',
  },
}

export type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  theme: typeof lightTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const STORAGE_KEY = 'academix:theme'

export const useAppTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const system = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>('system')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v)
      })
      .catch(() => {})
  }, [])

  const value = useMemo(() => {
    const isDarkMode =
      preference === 'system' ? system === 'dark' : preference === 'dark'
    const setPreference = (p: ThemePreference) => {
      setPreferenceState(p)
      AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {})
    }
    return {
      isDarkMode,
      preference,
      setPreference,
      toggleTheme: () => setPreference(isDarkMode ? 'light' : 'dark'),
      theme: isDarkMode ? darkTheme : lightTheme,
    }
  }, [preference, system])

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={value.theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  )
}
