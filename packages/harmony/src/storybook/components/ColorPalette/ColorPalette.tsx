import { Fragment } from 'react'

import { Text } from 'components'
import { Theme, ThemeColors, themeColorsMap } from 'storybook/colors'

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
  secondary: 'Seconday',
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

type ThemeKey = keyof ThemeColors
type RowColors = typeof themeColorsMap[Theme][ThemeKey]

type ColorRowProps = {
  themeKey: ThemeKey
  colors: RowColors
}

const ColorRow = ({ colors, themeKey }: ColorRowProps) => {
  const colorNames = Object.keys(colors)

  return (
    <section className={styles.colorSection}>
      <div className={styles.colorSectionInfo}>
        <Text variant='body' strength='strong'>
          {messages[themeKey]}
        </Text>
        <Text variant='body' strength='weak'>
          {messages[`${themeKey}Desc`]}
        </Text>
      </div>
      <div className={styles.colorTileContainer}>
        {colorNames.map((name) => (
          <ColorSwatch
            key={`colorTile-${name}`}
            name={name}
            color={colors[name as keyof typeof colors]}
          />
        ))}
      </div>
    </section>
  )
}

export const ColorPalette = ({ theme = 'day' }: ColorPaletteProps) => {
  const colors = themeColorsMap[theme]
  const themeKeys = Object.keys(colors)

  return (
    <div className={styles.paletteContainer}>
      <Text variant='display' size='xLarge'>
        {messages.title}
      </Text>
      <Text variant='body' size='large'>
        {messages.description}
      </Text>
      {themeKeys.map((key) => {
        const themeKey = key as keyof ThemeColors

        return (
          <Fragment key={themeKey}>
            <div className={styles.divider} />
            <ColorRow themeKey={themeKey} colors={colors[themeKey]} />
          </Fragment>
        )
      })}
    </div>
  )
}
