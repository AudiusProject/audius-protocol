import { useCallback } from 'react'

import { ExpandableNavItem, ExpandableNavItemProps } from '@audius/harmony'

import { RestrictionType, useRequiresAccountFn } from 'hooks/useRequiresAccount'

type Props = Omit<ExpandableNavItemProps, 'onClick'> & {
  restriction?: RestrictionType
}

export const RestrictedExpandableNavItem = ({
  restriction = 'none',
  disabled,
  ...props
}: Props) => {
  const { requiresAccount } = useRequiresAccountFn(undefined, restriction)

  const handleClick = useCallback(() => {
    if (restriction !== 'none') {
      requiresAccount()
    }
  }, [requiresAccount, restriction])

  const isDisabled = restriction !== 'none' || !!disabled

  return (
    <ExpandableNavItem onClick={handleClick} disabled={isDisabled} {...props} />
  )
}
