import { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { IconSize, Text, useTheme } from '@audius/harmony'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { useSsrContext } from 'ssr/SsrContext'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'

import { TextLink, TextLinkProps } from './TextLink'

const { getUser } = cacheUsersSelectors

type UserLinkProps = Omit<TextLinkProps, 'to'> & {
  userId: ID
  badgeSize?: IconSize
  popover?: boolean
}

export const UserLink = (props: UserLinkProps) => {
  const { isServerSide } = useSsrContext()
  const { userId, badgeSize = 's', popover, children, ...other } = props
  const { iconSizes, spacing } = useTheme()

  const url = useSelector((state) => {
    const handle = getUser(state, { id: userId })?.handle
    return handle ? profilePage(handle) : ''
  })

  const handle = useSelector((state) => getUser(state, { id: userId })?.handle)
  const userName = useSelector((state) => getUser(state, { id: userId })?.name)

  const linkElement = (
    <TextLink
      to={url}
      css={{ columnGap: spacing.xs, alignItems: 'center' }}
      ellipses={popover}
      {...other}
    >
      <Text ellipses>{userName}</Text>
      <UserBadges
        badgeSize={iconSizes[badgeSize]}
        userId={userId}
        css={{ marginTop: spacing['2xs'] }}
      />
      {children}
    </TextLink>
  )

  return !isServerSide && popover && handle ? (
    <ArtistPopover
      css={{ display: 'inline-flex', overflow: 'hidden' }}
      handle={handle}
      component='span'
    >
      {linkElement}
    </ArtistPopover>
  ) : (
    linkElement
  )
}
