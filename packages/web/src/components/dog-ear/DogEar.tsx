import { DogEarType } from '@audius/common/models'
import {
  IconVisibilityHidden,
  IconStar,
  IconSpecialAccess,
  IconCart,
  IconCollectible,
  IconLock,
  useTheme,
  ColorTheme,
  Box
} from '@audius/harmony'

import Rectangle from 'assets/img/dogEarRectangle.svg'

export type DogEarProps = {
  type: DogEarType
  className?: string
}

const getIcon = (type: DogEarType) => {
  switch (type) {
    case DogEarType.STAR:
      return IconStar
    case DogEarType.HIDDEN:
      return IconVisibilityHidden
    case DogEarType.LOCKED:
      return IconLock
    case DogEarType.COLLECTIBLE_GATED:
      return IconCollectible
    case DogEarType.USDC_PURCHASE:
      return IconCart
    case DogEarType.SPECIAL_ACCESS:
    default:
      return IconSpecialAccess
  }
}

const getColor = (type: DogEarType, color: ColorTheme['day']) => {
  switch (type) {
    case DogEarType.COLLECTIBLE_GATED:
    case DogEarType.SPECIAL_ACCESS:
    case DogEarType.LOCKED:
      return color.special.blue
    case DogEarType.USDC_PURCHASE:
      return color.special.lightGreen
    case DogEarType.STAR:
      return color.secondary.secondary
    case DogEarType.HIDDEN:
      return color.neutral.neutral
  }
}

export const DogEar = (props: DogEarProps) => {
  const { type, className } = props
  const Icon = getIcon(type)
  const { spacing, color } = useTheme()
  const tagColor = getColor(type, color)

  return (
    <Box
      css={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        overflow: 'hidden'
      }}
      borderTopLeftRadius='m'
      h='3xl'
      w='3xl'
      className={className}
    >
      <Rectangle
        css={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          color: tagColor
        }}
      />
      <Icon
        size='s'
        color='staticWhite'
        css={{ position: 'absolute', top: spacing.unit1, left: spacing.unit1 }}
      />
    </Box>
  )
}
