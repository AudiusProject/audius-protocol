import Color from 'color'
import { set } from 'lodash'

/**
 * Colorizes a lottie file given the paths of elements
 * Lifted from
 * https://github.com/lottie-react-native/lottie-react-native/issues/671#issuecomment-823157024
 * Path context can be computed using this tool:
 * https://github.com/Noitidart/Colorize-Lottie
 */
export const colorize = (json: object, colorByPath: Record<string, string>) => {
  const nextJson = JSON.parse(JSON.stringify(json))

  Object.entries(colorByPath).forEach(([path, color]) => {
    if (!color) return
    const rgbValues = Color(color).object()
    const rFraction = rgbValues.r / 255
    const gFraction = rgbValues.g / 255
    const bFraction = rgbValues.b / 255

    const pathParts = path.split('.')
    set(nextJson, [...pathParts, 0], rFraction)
    set(nextJson, [...pathParts, 1], gFraction)
    set(nextJson, [...pathParts, 2], bFraction)
  })

  return nextJson
}
