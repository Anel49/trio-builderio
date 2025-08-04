/**
 * Centralized color system for consistent color usage across the application.
 * These colors reference the CSS custom properties defined in global.css
 * and provide semantic naming for specific use cases.
 */

// Core semantic colors (using Tailwind CSS custom properties)
export const colors = {
  // Background colors
  background: {
    primary: 'bg-background',
    secondary: 'bg-secondary',
    muted: 'bg-muted',
    accent: 'bg-accent',
    card: 'bg-card',
    destructive: 'bg-destructive',
  },

  // Text colors
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive-foreground',
    white: 'text-white',
    muted: 'text-muted-foreground',
  },

  // Border colors
  border: {
    default: 'border-border',
    primary: 'border-primary',
    muted: 'border-muted',
    input: 'border-input',
  },

  // Interactive element colors
  interactive: {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  },

  // Status colors (using specific color values where needed)
  status: {
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  },

  // Rating and feedback colors
  rating: {
    star: 'text-yellow-400 fill-yellow-400',
    heart: 'text-red-500',
    heartFilled: 'text-red-500 fill-red-500',
  },

  // Specific UI element colors
  ui: {
    filterBanner: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
    onlineIndicator: 'bg-green-500 border-background',
    shadow: 'shadow-2xl dark:shadow-gray-900/30',
  },

  // Hover states
  hover: {
    primary: 'hover:bg-primary/90',
    secondary: 'hover:bg-secondary/90',
    muted: 'hover:bg-muted/90',
    accent: 'hover:bg-accent/90',
    destructive: 'hover:bg-destructive/90',
    transparent: 'hover:bg-transparent',
  },

  // Focus states
  focus: {
    ring: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    primary: 'focus-visible:ring-primary',
  },
} as const;

// Utility function to combine multiple color classes
export const combineColors = (...colorClasses: string[]): string => {
  return colorClasses.filter(Boolean).join(' ');
};

// Common color combinations for frequent use cases
export const colorCombinations = {
  // Button variants
  buttonPrimary: combineColors(colors.interactive.primary, colors.hover.primary, colors.focus.ring),
  buttonSecondary: combineColors(colors.interactive.secondary, colors.hover.secondary, colors.focus.ring),
  buttonGhost: combineColors(colors.interactive.ghost, colors.focus.ring),
  buttonOutline: combineColors(colors.interactive.outline, colors.focus.ring),

  // Card variants
  cardDefault: combineColors(colors.background.card, colors.border.default),
  cardHover: combineColors(colors.background.card, colors.border.default, 'hover:shadow-lg'),

  // Input variants
  inputDefault: combineColors(colors.background.card, colors.border.input, colors.focus.ring),
  
  // Text variants
  textHeading: colors.text.primary,
  textBody: colors.text.primary,
  textMuted: colors.text.muted,
  textError: colors.text.destructive,
} as const;

// Export individual color utilities for specific use cases
export const {
  background,
  text,
  border,
  interactive,
  status,
  rating,
  ui,
  hover,
  focus,
} = colors;
