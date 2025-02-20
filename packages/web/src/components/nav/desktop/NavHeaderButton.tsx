import { Ref, forwardRef } from 'react'

import { IconButton, IconButtonProps } from '@audius/harmony'

type NavHeaderButtonProps = IconButtonProps & {
  isActive?: boolean
}

export const NavHeaderButton = forwardRef(
  (props: NavHeaderButtonProps, ref: Ref<HTMLButtonElement>) => {
    const { isActive, ...other } = props

    return (
      <IconButton
        ref={ref}
        ripple
        color='subdued'
        activeColor='default'
        isActive={isActive}
        {...other}
      />
    )
  }
)
