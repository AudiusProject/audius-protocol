import { Theme, themeActions, themeSelectors } from '@audius/common'
import { SectionList, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Divider, SegmentedControl, Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeVariant } from 'app/utils/theme'

import { primitiveTheme } from './color'

const { setTheme } = themeActions
const { getTheme } = themeSelectors

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    gap: spacing(4),
    padding: spacing(4),
    backgroundColor: palette.white
  },
  header: {
    gap: spacing(4)
  },
  sectionHeader: {
    backgroundColor: palette.white,
    paddingVertical: spacing(3)
  },
  sectionRow: {
    gap: spacing(3)
  },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: spacing(2),
    rowGap: spacing(4),
    flexWrap: 'wrap'
  },
  swatch: {
    overflow: 'hidden',
    height: spacing(33),
    width: spacing(24)
  },
  swatch2: {
    height: spacing(33) + 12,
    width: spacing(24) + 12
  },
  swatchColor: {
    flex: 1,
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1
  },
  swatchText: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing(2),
    gap: spacing(1)
  },
  divider: {
    marginVertical: spacing(8)
  }
}))

const messages = {
  title: 'Color',
  description:
    'Primitives include all the Audius colors. They gave a numeric name to our HEX values and are organized from lightest to darkest.',
  staticDescription:
    'Static colors remain the same across all appearance modes: Day, Dark, and Matrix.',
  primaryDescription:
    'Primary is our brand color. It is used across our interface to represent elements with the highest importance. It defines the overall look and feel of Audius.',
  secondaryDescription:
    'Secondary colors are use in components such as pills, alerts and labels. These secondary colors are used for secondary actions, while the primary color(s) should take precedence.',
  neutralDescription:
    'Neutral is the foundation of the Audius color system. Almost everything in our designs - text form fields, backgrounds, dividers - are usually neutral.',
  specialDescription:
    'Special is a unique bucket of primitive accent, success, warning, gradient, and background colors.'
}

type ColorSwatchProps = {
  title: string
  hex: string
}

const PaletteSegmentedControl = () => {
  const dispatch = useDispatch()
  const theme = useSelector(getTheme)

  return (
    <SegmentedControl
      fullWidth
      options={[
        { key: Theme.DEFAULT, text: 'Day' },
        { key: Theme.DARK, text: 'Dark' },
        { key: Theme.MATRIX, text: 'Matrix' }
      ]}
      onSelectOption={(theme: Theme) => {
        dispatch(setTheme({ theme }))
      }}
      defaultSelected={theme ?? Theme.DEFAULT}
    />
  )
}

function ColorSwatch(props: ColorSwatchProps) {
  const styles = useStyles()
  const { title, hex } = props
  // TODO add gradient!
  if (typeof hex !== 'string') return null

  return (
    <Tile style={styles.swatch2} styles={{ content: styles.swatch }}>
      <View style={[styles.swatchColor, { backgroundColor: hex }]} />
      <View style={styles.swatchText}>
        <Text weight='demiBold' textTransform='capitalize'>
          {title}
        </Text>
        <Text>{hex}</Text>
      </View>
    </Tile>
  )
}

type ColorRowProps = {
  description: string
  colors: any
}

function ColorRow(props: ColorRowProps) {
  const { description, colors } = props
  const styles = useStyles()
  const colorKeys = Object.keys(colors)

  return (
    <View style={styles.sectionRow}>
      <Text>{description}</Text>
      <View style={styles.swatches}>
        {colorKeys.map((colorKey) => (
          <ColorSwatch key={colorKey} title={colorKey} hex={colors[colorKey]} />
        ))}
      </View>
    </View>
  )
}

function Colors() {
  const theme = useThemeVariant()
  const themeToHarmonyTheme = {
    [Theme.DEFAULT]: 'day',
    [Theme.AUTO]: 'day',
    [Theme.DARK]: 'dark',
    [Theme.MATRIX]: 'matrix'
  }
  const styles = useStyles()
  const themedPrimitives = primitiveTheme[themeToHarmonyTheme[theme]]
  const rows = [
    {
      title: 'Static',
      data: [
        {
          description: messages.staticDescription,
          colors: themedPrimitives.static
        }
      ]
    },
    {
      title: 'Primary',
      data: [
        {
          description: messages.primaryDescription,
          colors: themedPrimitives.primary
        }
      ]
    },
    {
      title: 'Secondary',
      data: [
        {
          description: messages.secondaryDescription,
          colors: themedPrimitives.secondary
        }
      ]
    },
    {
      title: 'Neutral',
      data: [
        {
          description: messages.neutralDescription,
          colors: themedPrimitives.neutral
        }
      ]
    },
    {
      title: 'Special',
      data: [
        {
          description: messages.specialDescription,
          colors: themedPrimitives.special
        }
      ]
    }
  ]

  return (
    <View style={styles.root}>
      <SectionList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text fontSize='xxxxl' weight='bold'>
              {messages.title}
            </Text>
            <Text fontSize='large'>{messages.description}</Text>
            <Divider />
            <PaletteSegmentedControl />
          </View>
        }
        // @ts-ignore
        sections={rows}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text fontSize='xl' weight='demiBold'>
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => <ColorRow {...item} />}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        stickySectionHeadersEnabled
      />
    </View>
  )
}

const ColorMeta = {
  title: 'Foundation/Color',
  component: Colors
}

export default ColorMeta

export const Docs = {}
