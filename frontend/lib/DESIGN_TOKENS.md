# Design Tokens System

This document explains how to use the centralized design tokens system to maintain consistency across the LendIt application.

## Overview

The design tokens system is located in `client/lib/design-tokens.ts` and provides semantic naming for:

- **Spacing & Layout**: Grid columns, gaps, padding, margins, dimensions
- **Typography**: Font sizes, weights, line heights
- **Animations**: Transition durations, transforms, common animation combinations
- **Border Radius**: Consistent rounded corners
- **Shadows**: Box shadow definitions
- **Z-index**: Layering values
- **Layout Patterns**: Common flex/grid/positioning patterns

## Basic Usage

```tsx
import {
  spacing,
  typography,
  animations,
  layouts,
  combineTokens
} from "@/lib/design-tokens";

// Basic usage
<div className={spacing.padding.card}>Content</div>
<h1 className={typography.combinations.heading}>Title</h1>
<div className={layouts.flex.between}>Flex content</div>

// Combining multiple tokens
<Card className={combineTokens(
  'group cursor-pointer',
  animations.combinations.productCard,
  shadows.hover.productCard
)}>
```

## Token Categories

### Spacing

```tsx
// Grid layouts
spacing.grid.responsive.oneToThree; // "grid-cols-1 md:grid-cols-3"
spacing.grid.responsive.profileLayout; // "grid-cols-1 lg:grid-cols-10"

// Gaps and padding
spacing.gap.md; // "gap-6"
spacing.padding.card; // "p-6"
spacing.padding.container; // "px-4 sm:px-6 lg:px-8"

// Dimensions
spacing.dimensions.header; // "h-16"
spacing.dimensions.icon.sm; // "h-4 w-4"
spacing.dimensions.productImage; // "h-48"
```

### Typography

```tsx
// Individual properties
typography.size.xl; // "text-xl"
typography.weight.semibold; // "font-semibold"

// Semantic combinations
typography.combinations.heading; // "text-3xl md:text-4xl font-bold"
typography.combinations.price; // "text-2xl font-bold text-primary"
typography.combinations.body; // "text-base font-normal"
```

### Animations

```tsx
// Durations
animations.duration.normal; // "duration-200"

// Common combinations
animations.combinations.productCard; // "transition-all duration-300 overflow-hidden hover:scale-105"
animations.combinations.button; // "transition-colors duration-200"

// Transforms
animations.transform.scale.hover; // "hover:scale-105"
animations.transform.translate.up; // "hover:-translate-y-1"
```

### Layout Patterns

```tsx
// Flex patterns
layouts.flex.between; // "flex items-center justify-between"
layouts.flex.center; // "flex items-center justify-center"
layouts.flex.start; // "flex items-center justify-start"

// Grid patterns
layouts.grid.responsive; // "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
layouts.grid.listings; // "grid grid-cols-1 md:grid-cols-2 gap-6"

// Position patterns
layouts.absolute.topRight; // "absolute top-3 right-3"
layouts.absolute.bottomLeft; // "absolute bottom-3 left-3"

// Container
layouts.container; // "container mx-auto px-4 sm:px-6 lg:px-8"
```

### Other Categories

```tsx
// Shadows
shadows.hover.productCard; // "hover:shadow-xl"
shadows.modal; // "shadow-2xl dark:shadow-gray-900/30"

// Z-index
zIndex.header; // "z-50"
zIndex.modal; // "z-50"
zIndex.dropdown; // "z-10"

// Border radius
borderRadius.card; // "rounded-lg"
borderRadius.button; // "rounded-md"
borderRadius.full; // "rounded-full"
```

## Best Practices

1. **Use semantic tokens over specific values**:

   ```tsx
   // ✅ Good
   <div className={spacing.padding.card}>

   // ❌ Avoid
   <div className="p-6">
   ```

2. **Combine tokens with `combineTokens` utility**:

   ```tsx
   // ✅ Good
   <div className={combineTokens(
     layouts.flex.between,
     spacing.padding.card,
     'custom-class'
   )}>

   // ❌ Avoid
   <div className="flex items-center justify-between p-6 custom-class">
   ```

3. **Use layout patterns for common layouts**:

   ```tsx
   // ✅ Good
   <div className={layouts.grid.responsive}>

   // ❌ Avoid
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
   ```

4. **Prefer typography combinations for consistent text styling**:

   ```tsx
   // ✅ Good
   <h1 className={typography.combinations.heading}>

   // ❌ Avoid
   <h1 className="text-3xl md:text-4xl font-bold">
   ```

## Integration with Color System

Design tokens work seamlessly with the color system:

```tsx
import { colors } from "@/lib/colors";
import { typography, layouts, combineTokens } from "@/lib/design-tokens";

<div className={combineTokens(
  layouts.flex.between,
  typography.combinations.body,
  colors.text.primary
)}>
```

## Adding New Tokens

When adding new design tokens:

1. Follow the semantic naming convention
2. Group related tokens in appropriate categories
3. Create combinations for frequently used patterns
4. Update this documentation
5. Consider creating migration scripts for existing hardcoded values

## Migration from Hardcoded Values

To migrate existing components:

1. Import the design tokens you need
2. Replace hardcoded classes with semantic tokens
3. Use `combineTokens` for multiple classes
4. Test for visual consistency
5. Update any custom CSS that might conflict

Example migration:

```tsx
// Before
<Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
  <CardContent className="p-6">
    <h3 className="text-2xl font-bold text-primary">Price</h3>
  </CardContent>
</Card>

// After
<Card className={combineTokens(
  'group cursor-pointer',
  animations.combinations.productCard,
  shadows.hover.productCard
)}>
  <CardContent className={spacing.padding.card}>
    <h3 className={typography.combinations.price}>Price</h3>
  </CardContent>
</Card>
```
