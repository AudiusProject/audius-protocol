import type { Color } from '@audius/common/models'

const componentToHex = (value: number) => {
  const hex = value.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

export const convertRGBToHex = (color: Color) => {
  return (
    componentToHex(Math.round(color.r)) +
    componentToHex(Math.round(color.g)) +
    componentToHex(Math.round(color.b))
  )
}
