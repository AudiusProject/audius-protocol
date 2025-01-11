import { useCallback } from 'react'

import { ExpandableNavItem, ExpandableNavItemProps } from '@audius/harmony'

import { RestrictionType, useRequiresAccountFn } from 'hooks/useRequiresAccount'

type Props = Omit<ExpandableNavItemProps, 'onClick'> & {
  restriction?: RestrictionType
}

export const RestrictedExpandableNavItem = ({
  restriction = 'none',
  ...props
}: Props) => {
  const { requiresAccount } = useRequiresAccountFn(undefined, restriction)

  const handleClick = useCallback(() => {
    if (restriction !== 'none') {
      requiresAccount()
    }
  }, [requiresAccount, restriction])

  return <ExpandableNavItem onClick={handleClick} {...props} />
}
