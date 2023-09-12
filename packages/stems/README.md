<p align="center">
  <p align="center">
    An audio-forward React Component library built with ❤️ from the team <a href="https://audius.org">@Audius</a>.
  </p>
  <p align="center">
    <b>🚧  Actively under development, not recommended for production use! 🚧</b>
  </p>
</p>

<br/>
<br/>

[![NPM](https://img.shields.io/npm/v/stems.svg)](https://www.npmjs.com/package/stems) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Installation

Install `@audius/stems` required peer dependencies:

```bash
npm install --save bn.js classnames@2.2.6 lodash@4.17.20 moment@2.24.0 prop-types react react-dom react-spring@8.0.27
```

Then install `@audius/stems`

```bash
npm install --save @audius/stems
```

## Usage

```js
import React from 'react'
import { Button } from '@audius/stems'

import '@audius/stems/dist/stems.css'

const App = () => {
  return <Button text='Hello World!' />
}
```

Optional: You may also wish to include the Avenir font, which is provided as a css file

```js
import '@audius/stems/dist/avenir.css'
```

## Development

Run storybook:

```bash
npm run storybook
```

Run the example app (docs site):

```bash
cd example
npm start
```
