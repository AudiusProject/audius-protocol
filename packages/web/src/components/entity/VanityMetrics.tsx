import { useCallback, MouseEvent } from 'react'

import { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { Text } from '@audius/harmony'

import { TextLink, TextLinkProps } from 'components/link'
import { useSelector } from 'utils/reducer'

const { getUser } = cacheUsersSelectors

type VanityMetricProps = TextLinkProps

export const VanityMetric = (props: VanityMetricProps) => {
  const { children, onClick, ...other } = props
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.stopPropagation()
      onClick?.(e)
    },
    [onClick]
  )
  return (
    <TextLink
      variant='subdued'
      size='xs'
      applyHoverStylesToInnerSvg
      noUnderlineOnHover
      css={(theme) => ({
        gap: theme.spacing.xs,
        alignItems: 'center',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap'
      })}
      onClick={handleClick}
      {...other}
    >
      {children}
    </TextLink>
  )
}

export const UserName = (props: { userId: ID }) => {
  const { userId } = props
  const userName = useSelector((state) => getUser(state, { id: userId })?.name)

  return <Text>{userName}</Text>
}
