/**
 * Centralized design tokens for consistent design values across the application.
 * These tokens provide semantic naming for spacing, typography, animations, and other design values.
 */

// Spacing system (using Tailwind's spacing scale)
export const spacing = {
  // Grid and layout
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-2', 
    cols3: 'grid-cols-3',
    cols4: 'grid-cols-4',
    cols5: 'grid-cols-5',
    cols6: 'grid-cols-6',
    cols10: 'grid-cols-10',
    // Common responsive patterns
    responsive: {
      oneToTwo: 'grid-cols-1 md:grid-cols-2',
      oneToThree: 'grid-cols-1 md:grid-cols-3',
      oneToFour: 'grid-cols-1 md:grid-cols-4',
      twoToThree: 'grid-cols-2 md:grid-cols-3',
      twoToFour: 'grid-cols-2 md:grid-cols-4',
      threeColumns: 'grid-cols-1 md:grid-cols-3',
      profileListings: 'grid-cols-1 md:grid-cols-3',
      browseListings: 'grid-cols-1 md:grid-cols-2',
      categoryGrid: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      footerGrid: 'grid-cols-1 md:grid-cols-4',
      tabsGrid: 'grid-cols-3',
      searchForm: 'grid-cols-1 md:grid-cols-[3fr_1fr]',
      productDetail: 'grid-cols-1 lg:grid-cols-5',
      profileLayout: 'grid-cols-1 lg:grid-cols-10',
    },
  },

  // Gap values
  gap: {
    xs: 'gap-2',
    sm: 'gap-4', 
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  },

  // Padding values
  padding: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
    // Common patterns
    container: 'px-4 sm:px-6 lg:px-8',
    section: 'py-8',
    sectionLg: 'py-16',
    card: 'p-6',
    cardSm: 'p-4',
    modal: 'p-6',
    button: 'px-4 py-2',
    buttonLg: 'px-6 py-3',
  },

  // Margin values
  margin: {
    xs: 'm-2',
    sm: 'm-4',
    md: 'm-6', 
    lg: 'm-8',
    xl: 'm-12',
    // Common patterns
    bottomSm: 'mb-2',
    bottomMd: 'mb-6',
    bottomLg: 'mb-12',
    topSm: 'mt-2',
    topMd: 'mt-6',
    centerX: 'mx-auto',
  },

  // Height and width values
  dimensions: {
    header: 'h-16',
    avatar: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    },
    icon: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    },
    productImage: 'h-48',
    searchForm: 'w-[70vw]',
    modalSm: 'max-w-sm',
    modal: 'max-w-2xl',
    modalMd: 'max-w-3xl',
    modalLg: 'max-w-4xl',
    modalContent: 'max-h-[80vh]',
    minHeight: {
      screen: 'min-h-screen',
      authForm: 'min-h-[calc(100vh-4rem)]',
    },
  },
} as const;

// Typography system
export const typography = {
  // Font sizes
  size: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    // Semantic sizes
    body: 'text-base',
    caption: 'text-sm',
    subtitle: 'text-lg',
    title: 'text-2xl',
    heading: 'text-3xl md:text-4xl',
    hero: 'text-4xl md:text-5xl lg:text-6xl',
    price: 'text-2xl',
  },

  // Font weights
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },

  // Line heights
  lineHeight: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },

  // Common typography combinations
  combinations: {
    heading: 'text-3xl md:text-4xl font-bold',
    subheading: 'text-xl font-semibold',
    body: 'text-base font-normal',
    caption: 'text-sm text-muted-foreground',
    price: 'text-2xl font-bold text-primary',
    button: 'font-medium',
    label: 'text-sm font-medium',
  },
} as const;

// Animation and transition system
export const animations = {
  // Transition durations
  duration: {
    fast: 'duration-150',
    normal: 'duration-200', 
    slow: 'duration-300',
    slower: 'duration-500',
    slowest: 'duration-1000',
  },

  // Transition properties
  transition: {
    all: 'transition-all',
    colors: 'transition-colors',
    transform: 'transition-transform',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',
  },

  // Common animation combinations
  combinations: {
    button: 'transition-colors duration-200',
    card: 'transition-all duration-300',
    productCard: 'transition-all duration-300 overflow-hidden hover:scale-105',
    categoryCard: 'transition-all duration-300 hover:-translate-y-1',
    hover: 'transition-all duration-200',
    focus: 'transition-all duration-200',
    heartButton: 'heart-button-transition',
    icon: 'transition-transform duration-200',
    modal: 'transition ease-in-out',
  },

  // Transform values
  transform: {
    scale: {
      hover: 'hover:scale-105',
      active: 'scale-105',
      button: 'hover:scale-110',
      map: 'scale-125',
    },
    translate: {
      up: 'hover:-translate-y-1',
      right: 'group-hover:translate-x-1',
    },
    rotate: {
      chevron: 'group-data-[state=open]:rotate-180',
      '45': 'rotate-45',
      '90': 'rotate-90',
      '180': 'rotate-180',
    },
  },
} as const;

// Border radius system
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
  // Common patterns
  card: 'rounded-lg',
  button: 'rounded-md',
  input: 'rounded-md',
  modal: 'rounded-lg',
  avatar: 'rounded-full',
  badge: 'rounded-md',
  image: 'rounded-lg',
} as const;

// Shadow system
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  // Semantic shadows
  card: 'shadow-lg',
  modal: 'shadow-2xl dark:shadow-gray-900/30',
  dropdown: 'shadow-lg',
  button: 'shadow-sm',
  tooltip: 'shadow-lg',
  // Hover shadows
  hover: {
    card: 'hover:shadow-lg',
    button: 'hover:shadow-md',
    productCard: 'hover:shadow-xl',
  },
} as const;

// Z-index system (using consistent layering)
export const zIndex = {
  base: 'z-0',
  dropdown: 'z-10',
  header: 'z-50',
  modal: 'z-50',
  tooltip: 'z-20',
  overlay: 'z-40',
  map: 'z-10',
  mapTooltip: 'z-20',
  // Common patterns
  fixed: 'z-50',
  absolute: 'z-10',
  relative: 'z-10',
} as const;

// Responsive breakpoints (for reference, Tailwind handles these automatically)
export const breakpoints = {
  sm: '640px',   // @media (min-width: 640px)
  md: '768px',   // @media (min-width: 768px) 
  lg: '1024px',  // @media (min-width: 1024px)
  xl: '1280px',  // @media (min-width: 1280px)
  '2xl': '1536px', // @media (min-width: 1536px)
} as const;

// Layout patterns (common layout combinations)
export const layouts = {
  // Container patterns
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8',
  sectionLg: 'py-16',
  
  // Flex patterns
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center',
    wrap: 'flex flex-wrap',
  },

  // Grid patterns
  grid: {
    auto: 'grid grid-cols-1 gap-6',
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
    categories: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6',
    listings: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    profile: 'grid grid-cols-1 md:grid-cols-3 gap-6',
  },

  // Position patterns
  absolute: {
    topRight: 'absolute top-3 right-3',
    bottomLeft: 'absolute bottom-3 left-3',
    center: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    topCenter: 'absolute -top-14 left-1/2 transform -translate-x-1/2',
  },
} as const;

// Export utility function to combine design tokens
export const combineTokens = (...tokens: string[]): string => {
  return tokens.filter(Boolean).join(' ');
};

// Export individual token categories for easier imports
export const {
  grid,
  gap,
  padding,
  margin,
  dimensions,
} = spacing;

export const {
  size,
  weight,
  lineHeight,
} = typography;

export const {
  duration,
  transition,
  transform,
} = animations;
