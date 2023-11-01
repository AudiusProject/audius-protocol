import { Fragment } from 'react'

import { Divider, Flex, Text } from 'components'
import { PrimitiveColors, primitiveTheme } from 'foundations/color'
import type { Theme } from 'foundations/theme/types'

import { ColorSwatch } from '../ColorSwatch'

import styles from './ColorPalette.module.css'

const messages = {
  title: 'Primitives',
  description:
    'Primitives include all the Audius colors. They give a numeric name to our HEX values and are organized from lightest to darkest.',
  static: 'Static',
  staticDesc:
    'Static colors remain the same across all appearance modes: Day, Dark, and Matrix.',
  primary: 'Primary',
  primaryDesc:
    'Primary is our brand color. It is used across our interface to represent elements with the highest importance. It defines the overall look and feel of Audius.',
  secondary: 'Secondary',
  secondaryDesc:
    'Secondary colors are use in components such as pills, alerts and labels. These secondary colors are used for secondary actions, while the primary color(s) should take precedence.',
  neutral: 'Neutral',
  neutralDesc:
    'Neutral is the foundation of the Audius color system. Almost everything in our designs - text form fields, backgrounds, dividers - are usually neutral.',
  special: 'Special',
  specialDesc:
    'Special is a unique bucket of primitive accent, success, warning, gradient, and background colors.'
}

type ColorPaletteProps = {
  theme?: Theme
}

type ThemeKey = keyof PrimitiveColors
type RowColors = PrimitiveColors[ThemeKey]

type ColorRowProps = {
  themeKey: ThemeKey
  colors: RowColors
}

const ColorRow = ({ colors, themeKey }: ColorRowProps) => {
  const colorNames = Object.keys(colors)

  return (
    <Flex gap='4xl'>
      <Flex className={styles.colorSectionInfo} direction='column' gap='l'>
        <Text variant='body' strength='strong'>
          {messages[themeKey]}
        </Text>
        <Text variant='body' strength='weak'>
          {messages[`${themeKey}Desc`]}
        </Text>
      </Flex>
      <Flex
        className={styles.colorTileContainer}
        alignItems='flex-start'
        gap='s'
        wrap='wrap'
      >
        {colorNames.map((name) => (
          <ColorSwatch
            key={`colorTile-${name}`}
            name={name}
            color={colors[name as keyof typeof colors]}
          />
        ))}
      </Flex>
    </Flex>
  )
}

export const ColorPalette = ({ theme = 'day' }: ColorPaletteProps) => {
  const colors = primitiveTheme[theme]
  const themeKeys = Object.keys(colors) as ThemeKey[]

  return (
    <Flex className={styles.paletteContainer} direction='column' gap='3xl'>
      <Text variant='display' size='xl'>
        {messages.title}
      </Text>
      <Text variant='body' size='l'>
        {messages.description}
      </Text>
      {themeKeys.map((key) => (
        <Fragment key={key}>
          <Divider />
          <ColorRow themeKey={key} colors={colors[key]} />
        </Fragment>
      ))}
    </Flex>
  )
}
