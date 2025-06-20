import { useCallback } from 'react'

import { ExpandableNavItem, ExpandableNavItemProps } from '@audius/harmony'

import { RestrictionType, useRequiresAccountFn } from 'hooks/useRequiresAccount'

type Props = Omit<ExpandableNavItemProps, 'onClick'> & {
  restriction?: RestrictionType
  onToggle?: (isOpen: boolean) => void
}

export const RestrictedExpandableNavItem = ({
  restriction = 'none',
  disabled,
  onToggle,
  ...props
}: Props) => {
  const { requiresAccount } = useRequiresAccountFn(undefined, restriction)

  const handleClick = useCallback(
    (isOpen: boolean) => {
      if (restriction !== 'none') {
        requiresAccount()
      }
      onToggle?.(isOpen)
    },
    [requiresAccount, restriction, onToggle]
  )

  return (
    <ExpandableNavItem onClick={handleClick} disabled={disabled} {...props} />
  )
}
