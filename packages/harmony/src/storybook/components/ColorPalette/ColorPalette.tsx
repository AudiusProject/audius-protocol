import { Fragment } from 'react'

import styled from '@emotion/styled'

import { Divider, Flex, Text } from 'components'
import { themeColorsMap } from 'styles/theme'
import type { Theme, ThemeColors } from 'styles/types'

import { ColorSwatch } from '../ColorSwatch'

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

type ThemeKey = keyof ThemeColors
type RowColors = typeof themeColorsMap[Theme][ThemeKey]

type ColorRowProps = {
  themeKey: ThemeKey
  colors: RowColors
}

const SectionInfo = styled(Flex)({ flex: '0 0 400px' })
const SwatchContainer = styled(Flex)({ flex: '1 1 0' })

const ColorRow = ({ colors, themeKey }: ColorRowProps) => {
  const colorNames = Object.keys(colors)

  return (
    <Flex gap='4xl'>
      <SectionInfo direction='column' gap='l'>
        <Text variant='body' strength='strong'>
          {messages[themeKey]}
        </Text>
        <Text variant='body' strength='weak'>
          {messages[`${themeKey}Desc`]}
        </Text>
      </SectionInfo>
      <SwatchContainer alignItems='flex-start' gap='s' wrap='wrap'>
        {colorNames.map((name) => (
          <ColorSwatch
            key={`colorTile-${name}`}
            name={name}
            color={colors[name as keyof typeof colors]}
          />
        ))}
      </SwatchContainer>
    </Flex>
  )
}

const PaletteContainer = styled(Flex)({
  maxWidth: '1080px',
  margin: 'auto',
  paddingInline: 'var(--harmony-unit-8)'
})

export const ColorPalette = ({ theme = 'day' }: ColorPaletteProps) => {
  const colors = themeColorsMap[theme]
  const themeKeys = Object.keys(colors) as ThemeKey[]

  return (
    <PaletteContainer direction='column' gap='3xl'>
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
    </PaletteContainer>
  )
}
