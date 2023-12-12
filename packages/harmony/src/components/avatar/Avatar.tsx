import { CSSObject, useTheme } from '@emotion/react'

import type { AvatarProps } from './types'

/*
 * The Avatar component is a visual indicator used to quickly identify a
 * user’s account.
 */
export const Avatar = (props: AvatarProps) => {
  const {
    src,
    strokeWidth = 'default',
    size = 'auto',
    variant = 'default',
    className,
    children
  } = props
  const { color } = useTheme()

  const sizeMap = {
    auto: '100%',
    small: '24px',
    large: '40px',
    xl: '80px'
  }

  const strokeWidthMap = {
    thin: '1.2px',
    default: '2px'
  }

  const rootCss: CSSObject = {
    height: sizeMap[size],
    width: sizeMap[size],
    overflow: 'hidden',
    borderRadius: 'calc(infinity * 1px)',
    border: `${strokeWidthMap[strokeWidth]} solid ${color.border.default}`,
    boxSizing: 'border-box',
    boxShadow:
      variant === 'strong'
        ? '0px 0.5px 1.5px 0px rgba(0, 0, 0, 0.03), 0px 1.5px 5px 0px rgba(0, 0, 0, 0.08), 0px 6px 15px 0px rgba(0, 0, 0, 0.10)'
        : 'none',
    backgroundColor: color.neutral.n400,
    position: 'relative',
    zIndex: 1
  }

  const imgCss: CSSObject = {
    height: sizeMap[size],
    width: sizeMap[size],
    backgroundImage: src ? `url(${src})` : undefined,
    backgroundColor: src ? 'unset' : color.neutral.n400,
    backgroundSize: 'cover',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  return (
    <div css={rootCss} className={className}>
      <div css={imgCss}>{children}</div>
    </div>
  )
}
