import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Paleta de colores disponibles
export const THEMES = {
  green: { primary: '#25D366', secondary: '#128C7E', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textSecondary: '#8696a0' },
  blue: { primary: '#0088cc', secondary: '#005f8c', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textSecondary: '#8696a0' },
  red: { primary: '#ff4444', secondary: '#cc0000', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textSecondary: '#8696a0' },
  purple: { primary: '#9c27b0', secondary: '#6a1b9a', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textSecondary: '#8696a0' },
  orange: { primary: '#ff9800', secondary: '#e65100', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textSecondary: '#8696a0' },
  pink: { primary: '#e91e63', secondary: '#ad1457', background: '#0a0a0a', surface: '#1a1a1a', text: '#ffffff', textSecondary: '#8696a0' },
};

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('green');
  const [theme, setTheme] = useState(THEMES.green);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeColor');
      if (savedTheme && THEMES[savedTheme]) {
        setThemeColor(savedTheme);
        setTheme(THEMES[savedTheme]);
      }
    } catch (error) {
      console.error('Error cargando tema:', error);
    }
  };

  const changeTheme = async (color) => {
    try {
      await AsyncStorage.setItem('themeColor', color);
      setThemeColor(color);
      setTheme(THEMES[color]);
    } catch (error) {
      console.error('Error guardando tema:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeColor, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
