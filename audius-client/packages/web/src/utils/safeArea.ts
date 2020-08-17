export enum SafeAreaDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

const directionMap = {
  [SafeAreaDirection.LEFT]: '--safe-area-inset-left',
  [SafeAreaDirection.RIGHT]: '--safe-area-inset-right',
  [SafeAreaDirection.TOP]: '--safe-area-inset-top',
  [SafeAreaDirection.BOTTOM]: '--safe-area-inset-bottom'
}

export const getSafeArea = (direction: SafeAreaDirection) => {
  const property = directionMap[direction]
  const style = getComputedStyle(document.documentElement)
  const propertyValue = style.getPropertyValue(property)
  return parseFloat(propertyValue.replace('px', ''))
}
