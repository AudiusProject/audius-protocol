# `eslint-config-audius`

A neat setup for eslint & prettier by the Audius team <3

## Install

`npm i -D eslint-config-audius`

Note: Be sure to install all of the peer dependencies

## Usage

```
{
  "extends": 'audius'
}
```

If using prettier formatter separately from eslint, be sure to add this to your `.prettierrc` file:

```
module.exports = {
  ...require('eslint-config-audius/.prettierc')
}
```
