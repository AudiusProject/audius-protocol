<p align="center">
  <img height="288px" src="./src/storybook/assets/harmonyLogoDark.png#gh-dark-mode-only">
  <img height="288px" src="./src/storybook/assets/harmonyLogo.png#gh-light-mode-only">

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

```ts
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

const App = () => {

  return (
    <HarmonyThemeProvider theme='day'>
        ...
    </HarmonyThemeProvider>
  )
}
```

## Usage

```ts
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

