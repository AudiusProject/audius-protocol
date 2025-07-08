import type { CSSProperties, FC } from 'react'

import { IconSize, iconSizes } from '../foundations/spacing'
import { roundedHexClipPath } from '../icons/SVGDefs'

export type IconProps = {
  width?: number | string
  height?: number | string
  size?: IconSize
  className?: string
  style?: CSSProperties
  hex?: boolean
}

export const createImageIcon = (src: string) => {
  const Icon: FC<IconProps> = ({
    width,
    height,
    size = 'm',
    className,
    style,
    hex = false
  }) => {
    const finalWidth =
      width ?? (size ? iconSizes[size as keyof typeof iconSizes] : 20)
    const finalHeight =
      height ?? (size ? iconSizes[size as keyof typeof iconSizes] : 20)
    return (
      <img
        src={src}
        width={finalWidth}
        height={finalHeight}
        className={className}
        style={style}
        css={{
          clipPath: hex ? `url(#${roundedHexClipPath})` : undefined
        }}
        alt=''
      />
    )
  }
  return Icon
}
