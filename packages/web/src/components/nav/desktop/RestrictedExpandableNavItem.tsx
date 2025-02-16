import { useCallback } from 'react'

import { ExpandableNavItem, ExpandableNavItemProps } from '@audius/harmony'

import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'
import { RestrictionType, useRequiresAccountFn } from 'hooks/useRequiresAccount'

type Props = Omit<ExpandableNavItemProps, 'onClick'> & {
  restriction?: RestrictionType
}

const RestrictedExpandableNavItemContent = ({
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

  return (
    <ExpandableNavItem onClick={handleClick} disabled={disabled} {...props} />
  )
}

export const RestrictedExpandableNavItem = componentWithErrorBoundary(
  RestrictedExpandableNavItemContent,
  {
    name: 'RestrictedExpandableNavItem'
  }
)
