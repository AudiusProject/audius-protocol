import { FlatList, View } from 'react-native'

import { Text, Tile } from 'app/components/core'

import { primitives } from './primitives'

const messages = {
  title: 'Primitives',
  description:
    'Primitives include all the Audius colors. They gave a numeric name to our HEX values and are organized from lightest to darkest.'
}

type ColorSwatchProps = {
  title: string
  hex: string
}

function ColorSwatch(props: ColorSwatchProps) {
  const { title, hex } = props
  return (
    <Tile>
      <View style={{ backgroundColor: hex, height: '50%' }} />
      <View>
        <Text>{title}</Text>
        <Text>{hex}</Text>
      </View>
    </Tile>
  )
}

type ColorRowProps = {
  title: string
  description: string
  colors: Record<string, string>
}

function ColorRow(props: ColorRowProps) {
  const { title, description, colors } = props
  const colorKeys = Object.keys(colors)
  return (
    <View>
      <Text>{title}</Text>
      <Text>{description}</Text>
      <View>
        {colorKeys.map((colorKey) => (
          <ColorSwatch key={colorKey} title={colorKey} hex={colors[colorKey]} />
        ))}
      </View>
    </View>
  )
}

function Primitives() {
  const dayPrimitives = primitives.day
  const rows = [
    {
      title: 'Static',
      description:
        'Static colors remain the same across all appearance modes: Day, Dark, and Matrix.',
      colors: dayPrimitives.static
    },
    {
      title: 'Primary',
      description:
        'Primary is our brand color. It is used across our interface to represent elements with the highest importance. It defines the overall look and feel of Audius.',
      colors: dayPrimitives.primary
    },
    {
      title: 'Secondary',
      description:
        'Secondary colors are use in components such as pills, alerts and labels. These secondary colors are used for secondary actions, while the primary color(s) should take precedence.',
      colors: dayPrimitives.secondary
    },
    {
      title: 'Neutral',
      description:
        'Secondary colors are use in components such as pills, alerts and labels. These secondary colors are used for secondary actions, while the primary color(s) should take precedence.',
      colors: dayPrimitives.neutral
    },
    {
      title: 'Special',
      description:
        'Special is a unique bucket of primitive accent, success, warning, gradient, and background colors.',
      colors: dayPrimitives.special
    }
  ]

  return (
    <View>
      <Text>{messages.title}</Text>
      <Text>{messages.description}</Text>
      <FlatList data={rows} renderItem={({ item }) => <ColorRow {...item} />} />
    </View>
  )
}

const PrimitivesMeta = {
  title: 'Foundation/Color/Primitives',
  component: Primitives
}

export default PrimitivesMeta

export const Basic = {}
