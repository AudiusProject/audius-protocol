import { Ref, forwardRef } from 'react'

import { IconButton, IconButtonProps, useTheme } from '@audius/harmony'

type NavHeaderButtonProps = IconButtonProps & {
  isActive?: boolean
}

export const NavHeaderButton = forwardRef(
  (props: NavHeaderButtonProps, ref: Ref<HTMLButtonElement>) => {
    const { isActive, ...other } = props
    const { color } = useTheme()

    const activeCss = {
      backgroundColor: color.neutral.n100,
      svg: {
        path: {
          fill: color.text.default
        }
      }
    }

    const css = {
      backgroundColor: color.background.surface1,
      svg: {
        path: {
          fill: color.icon.subdued
        }
      },
      '&:hover,&:active': activeCss
    }

    return (
      <IconButton
        ref={ref}
        css={[css, isActive && activeCss]}
        size='l'
        {...other}
      />
    )
  }
)
