// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import {
  MD3LightTheme,
  MD3DarkTheme,
  PaperProvider,
  configureFonts,
} from 'react-native-paper'
import Colors from '@/data/Colors'

// Customize the theme to match your app colors
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.PRIMARY,
    primaryContainer: Colors.PRIMARY + '20',
    surface: Colors.WHITE,
    surfaceVariant: Colors.LIGHT_GRAY,
    onSurface: Colors.BLACK,
    onSurfaceVariant: Colors.GRAY,
  },
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.PRIMARY,
    primaryContainer: Colors.PRIMARY + '20',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#8E8E93',
  },
}

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  theme: typeof lightTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

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
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark')

  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark')
  }, [systemColorScheme])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const theme = isDarkMode ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  )
}
