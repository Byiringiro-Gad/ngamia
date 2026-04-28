import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border-main text-text-muted active:scale-90 transition-all flex-shrink-0"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
