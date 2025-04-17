<p align="center">
  <img height="288px" src="https://github.com/AudiusProject/audius-protocol/blob/main/packages/harmony/src/storybook/assets/harmonyLogoDark.png#gh-dark-mode-only">
  <img height="288px" src="https://github.com/AudiusProject/audius-protocol/blob/main/packages/harmony/src/storybook/assets/harmonyLogo.png?raw=true#gh-light-mode-only">

  <p align="center">
    Harmony is design system focused on collaboration, reusability, and scalability.
  </p>
  <p align="center">
    It aims to harmonize code and Figma, provide a shared language for designers and developers, and provide consistent, reusable components for use across our platforms.
  </p>
  <p align="center">
    built with ❤️ from the team <a href="https://audius.org">@Audius</a>.
  </p>
</p>

<br />
<br />

## Docs

Full documentation can be found here: [Harmony Docs](https://harmony.audius.co)

## Installation

Install `@audius/harmony`:

```bash
npm install --save @audius/harmony
```

Due to an issue with react-virtualized, if using vite you must also install a plugin to fix the build:
https://www.npmjs.com/package/esbuild-plugin-react-virtualized

```bash
npm install --save-dev esbuild-plugin-react-virtualized
```

Follow the instructions to add the plugin to your vite config:

```js
// vite.config.js
import { defineConfig } from 'vite'
import fixReactVirtualized from 'esbuild-plugin-react-virtualized'

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      plugins: [fixReactVirtualized]
    }
  }
})
```

For more information, see:
https://github.com/bvaughn/react-virtualized/issues/1722

## Setup

Import styles exported by Harmony

```ts
import '@audius/harmony/dist/harmony.css'
```

Setup the ThemeProvider exported by Harmony

```tsx
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

const App = () => {
  return <HarmonyThemeProvider theme='day'>...</HarmonyThemeProvider>
}
```

In order use emotion yourself, follow their documentation for [setting up the css-prop](https://emotion.sh/docs/css-prop)

If using typescript you will need to:

1. Add an emotion.d.ts file and include the following for access to harmony's theme type

```ts
import '@emotion/react'
import type { HarmonyTheme } from '@audius/harmony'

declare module '@emotion/react' {
  export interface Theme extends HarmonyTheme {}
}
```

2. Update your tsconfig to specify the jsxImportLocation:

```ts
{
  "compilerOptions": {
    "jsxImportSource": "@emotion/react",
    ...
  }
}
```

## Usage

```tsx
import { Button, Flex } from '@audius/harmony'

const App = () => {
  return (
    <Flex gap='m'>
      <Button variant='secondary'>Click This!</Button>
      <Button>Click That!</Button>
    </Flex>
  )
}
```

## Development

Run storybook (docs site):

```bash
npm run storybook
```

## Contribution

A Contribution Guide is [available here](https://www.notion.so/audiusproject/Submitting-for-Design-Updates-52a8bc3bb68747818a96d2721bace27f).

## Responsive Design

Harmony includes utilities to help build responsive designs consistently across the application.

### Breakpoints

The breakpoints module provides standardized screen size breakpoints and media query helpers:

```tsx
import { breakpoints } from '@audius/harmony'

// Access specific breakpoint values
const tabletWidth = breakpoints.values.md // 1024

// Use predefined media queries
const mobileQuery = breakpoints.down.sm // (max-width: 768px)
const desktopQuery = breakpoints.up.md // (min-width: 1025px)
const tabletQuery = breakpoints.between.sm_md // (min-width: 769px) and (max-width: 1024px)

// Create custom media queries
const customQuery = breakpoints.createCustomQuery(500, 800) // (min-width: 500px) and (max-width: 800px)
```

### useMedia Hook

For reactive responsive designs, use the `useMedia` hook:

```tsx
import { useMedia } from '@audius/harmony'

const MyComponent = () => {
  const {
    // Common device categories
    isMobile, // <= 768px
    isTablet, // > 768px and <= 1024px
    isDesktop, // > 1024px

    // Detailed breakpoint checks
    isExtraSmall, // <= 480px
    isSmall, // <= 768px
    isMedium, // <= 1024px

    // Check custom queries
    matchesQuery
  } = useMedia()

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}

      {/* Check a custom query */}
      {matchesQuery('(orientation: portrait)') && <PortraitContent />}
    </div>
  )
}
```
