import { useTheme } from '@emotion/react'

import type { AvatarProps } from './types'

export const Avatar = (props: AvatarProps) => {
  const { url, strokeWidth = '2px', size = 'auto', variant = 'default' } = props
  const { color } = useTheme()
  const rootCss = {
    height: size === 'auto' ? '100%' : size,
    width: size === 'auto' ? '100%' : size,
    borderRadius: 'calc(infinity * 1px)',
    border: `${strokeWidth} solid ${color.border.default}`,
    boxShadow:
      variant === 'strong'
        ? '0px 0.5px 1.5px 0px rgba(0, 0, 0, 0.03), 0px 1.5px 5px 0px rgba(0, 0, 0, 0.08), 0px 6px 15px 0px rgba(0, 0, 0, 0.10)'
        : 'none',
    backgroundImage: `url(${url})`,
    backgroundColor: 'unset',
    backgroundSize: 'cover',
    position: 'relative',
    zIndex: 1
  }

  // @ts-ignore doesn't like position relative even though it works
  return <div css={rootCss} />
}
