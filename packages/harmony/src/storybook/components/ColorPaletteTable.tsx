import { useTheme } from '@emotion/react'

import { Box, Flex, Text } from 'components'
import { themes, HarmonyTheme } from 'foundations'
import type { Theme } from 'foundations/theme/types'

type ColorType = keyof HarmonyTheme['color']

type ColorSwatchProps = {
  colorType: ColorType
  colorName: string
  colorValue: string
  description?: string
}

const ColorSwatch = (props: ColorSwatchProps) => {
  const { colorType, colorName, colorValue, description = colorValue } = props
  const { color, cornerRadius, spacing } = useTheme()

  return (
    <Flex gap='l' alignItems='center'>
      <Box
        css={{
          height: spacing.unit10,
          width: spacing.unit10,
          background: colorValue,
          borderRadius: cornerRadius.xs,
          border: `0.5px solid ${color.border.default}`
        }}
      />
      <Flex direction='column' gap='unitHalf'>
        <Text css={{ margin: 0 }}>
          {colorType}-{colorName}
        </Text>
        <Text css={{ margin: 0 }}>{description}</Text>
      </Flex>
    </Flex>
  )
}

type ColorPaletteTableProps = {
  colorType: ColorType
  descriptions?: Record<string, string>
}

export const ColorPaletteTable = (props: ColorPaletteTableProps) => {
  const { colorType, descriptions } = props
  const colorNames = Object.keys(themes.day.color[colorType]).filter(
    (colorName) => colorName !== colorType
  ) as Array<keyof HarmonyTheme['color'][ColorType]>

  return (
    <table css={{ width: '100%' }}>
      <tr css={{ textAlign: 'left' }}>
        <th>Day</th>
        <th>Dark</th>
        <th>Matrix</th>
      </tr>
      {colorNames.map((colorName) => {
        const renderSwatch = (themeType: Theme) => (
          <td>
            <ColorSwatch
              colorType={colorType}
              colorName={colorName === 'text' ? 'text-icon' : colorName}
              colorValue={themes[themeType].color[colorType][colorName]}
              description={descriptions?.[colorName]}
            />
          </td>
        )

        return (
          <tr key={colorName}>
            {renderSwatch('day')}
            {renderSwatch('dark')}
            {renderSwatch('matrix')}
          </tr>
        )
      })}
    </table>
  )
}
