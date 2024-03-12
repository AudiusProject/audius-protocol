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

Install `@audius/harmony` required peer dependencies:

```bash
npm install --save @emotion/react @emotion/styled @radix-ui/react-slot @react-spring/web classnames lodash react-lottie react-merge-refs react-perfect-scrollbar react-use react-use-measure
```

Then install `@audius/harmony`

```bash
npm install --save @audius/harmony
```

## Setup

Import styles exported by Harmony

```ts
import '@audius/harmony/dist/harmony.css'
```

Setup the ThemeProvider exported by Harmony

```tsx
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

const App = () => {

  return (
    <HarmonyThemeProvider theme='day'>
        ...
    </HarmonyThemeProvider>
  )
}
```

In order use emotion yourself, follow their documentation for [setting up the css-prop](https://emotion.sh/docs/css-prop)

If using typescript add an emotion.d.ts file and include the following for access to harmony's theme type

```ts
import '@emotion/react'
import type { HarmonyTheme } from '@audius/harmony'

declare module '@emotion/react' {
  export interface Theme extends HarmonyTheme {}
}
```

## Usage

```tsx
import { Button, ButtonType, Flex } from '@audius/harmony'

const App = () => {
  return (
    <Flex gap='m'>
      <Button variant={ButtonType.SECONDARY}>Click This!</Button>
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
