import type { ReactNode } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical'
  children?: ReactNode
  className?: string
}

/**
 * A separator between two elements, usually consisting of a horizontal or vertical line.
 */
export const Divider = (props: DividerProps) => {
  const { orientation = 'horizontal', children, className } = props
  const { color, spacing } = useTheme()
  const border = `1px solid ${color.border.strong}`

  const css: CSSObject = {
    border: 'none',
    margin: 0,
    ...(children &&
      orientation === 'horizontal' && {
        display: 'flex',
        gap: spacing.s,
        whiteSpace: 'nowrap',
        textAlign: 'center',
        border: 0,
        '&::before, &::after': {
          content: '""',
          alignSelf: 'center',
          width: '100%',
          borderTop: border
        }
      }),
    ...(!children &&
      orientation === 'vertical' && {
        borderRight: border,
        alignSelf: 'stretch',
        height: 'auto'
      }),
    ...(!children &&
      orientation === 'horizontal' && {
        borderBottom: border
      })
  }

  const Root = children ? 'div' : 'hr'
  const role = children ? 'separator' : undefined

  return (
    <Root role={role} css={css} className={className}>
      {children}
    </Root>
  )
}
