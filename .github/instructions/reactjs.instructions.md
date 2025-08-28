---
description: 'Optimized React Native + TypeScript mobile development instructions with performance, UX, and best practices'
applyTo: '**/*.tsx, **/*.ts'
---

# React Native + TypeScript Mobile Development Instructions

## Project Context

- Latest React Native version
- TypeScript enabled
- Functional components with hooks
- Expo or custom Metro setup
- Focus on performance, maintainability, and mobile UX

## Architecture & Project Structure

- Organize by feature/domain
- Separate screens, components, hooks, services, and assets
- Container/Presentational pattern
- Clear data flow and prop hierarchy
- Shared utilities and constants centralized

## TypeScript Integration

- Strong typing for props, state, refs, and events
- Use generic components where possible
- Enable strict mode in `tsconfig.json`
- Leverage React Native & React types (`React.FC`, `ComponentProps`)

## Component & Screen Design

- Single Responsibility Principle
- Small, reusable components
- Avoid inline styles in performance-sensitive areas
- Memoize functional components using `React.memo`
- Flatten deeply nested components to reduce re-render complexity
- Use `useCallback` and `useMemo` for event handlers and derived values

## State Management

- Local state: `useState`
- Complex state: `useReducer`
- Global state: `useContext`, Redux Toolkit, Zustand, or Recoil
- Server state: React Query or SWR
- Avoid unnecessary re-renders of parent components

## Hooks & Effects

- Correct dependency arrays in `useEffect`
- Cleanup timers, subscriptions, and listeners
- Use `useRef` for DOM/Native element references
- Extract reusable logic into custom hooks
- Use `useWindowDimensions` for responsive layouts without extra re-renders

## Navigation

- React Navigation: Stack, Tab, Drawer
- Lazy-load screens for performance
- Proper handling of Android back button
- Deep linking and dynamic links support
- Maintain navigation state for complex flows

## Lists & Performance

- Use FlatList/SectionList instead of ScrollView for long lists
- Provide `keyExtractor`, `getItemLayout`, `initialNumToRender`, `maxToRenderPerBatch`
- Use `removeClippedSubviews={true}` for large lists
- Memoize list items with `React.memo`
- Avoid anonymous inline functions in renderItem
- Implement incremental data loading/pagination
- Optimize images with `react-native-fast-image` or caching libraries

## Styling

- `StyleSheet.create` or CSS-in-JS (styled-components/native, @shopify/restyle)
- Flexbox layouts for responsiveness
- Theming via context or libraries like `react-native-paper`
- Avoid heavy shadow styles on lists
- Minimize overdraw and nested Views

## Performance Optimization

- Use `InteractionManager.runAfterInteractions` for non-critical tasks
- Optimize images: compress, resize, and lazy-load
- Reduce re-renders via `React.memo`, `useCallback`, `useMemo`
- Avoid anonymous functions in render
- Avoid excessive logging in production
- Profile with Flipper or React Native Performance Monitor
- Test on real devices, not just simulators/emulators

## Data Fetching

- React Query or SWR for caching, retries, and pagination
- Offline support: AsyncStorage or libraries like MMKV
- Error handling and retry strategies
- Optimistic updates for better UX

## Forms & Inputs

- Controlled components
- Formik or React Hook Form for complex forms
- Mobile keyboard handling (`KeyboardAvoidingView`, `ScrollView` adjustments)
- Debounced validation to improve performance
- Accessible inputs: `accessibilityLabel`, `accessibilityHint`

## Error Handling

- Error Boundaries for components/screens
- Try/catch in async functions
- Provide fallback UI for network or state errors
- Log to remote monitoring (Sentry, Firebase Crashlytics)

## Testing

- Unit tests: Jest + React Native Testing Library
- Integration tests for screens and navigation flows
- Mock API requests
- Accessibility testing with screen readers

## Security

- Sanitize inputs
- HTTPS for API calls
- Avoid storing sensitive info insecurely
- Secure authentication and authorization flows

## Accessibility

- Use `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`
- Maintain color contrast and dynamic font scaling
- Ensure screen reader compatibility
- Test keyboard navigation for focusable elements

## Implementation Checklist

1. Plan architecture and folder structure
2. Set up TypeScript types and interfaces
3. Implement core screens and components
4. Add state management and API services
5. Configure navigation and deep linking
6. Optimize FlatList/SectionList performance
7. Implement styling, theming, and responsive layouts
8. Handle forms, validation, and keyboard
9. Add error handling and fallback UI
10. Profile performance on real devices
11. Write unit and integration tests
12. Ensure accessibility compliance
13. Document components, hooks, and best practices

## Additional Guidelines

- PascalCase for components, camelCase for functions
- ESLint + Prettier for consistent formatting
- Keep dependencies updated
- Profile memory usage and performance regularly
- Use `React Developer Tools` and Flipper for debugging

## Common Patterns

- Compound components
- Higher-Order Components for cross-cutting concerns
- Provider pattern for context-based state
- Render props for dynamic composition
- Container/Presentational separation
- Custom hooks for reusable logic
