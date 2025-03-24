import { useUser } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { IconSize, Text, useTheme } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges/UserBadges'

import { TextLink, TextLinkProps } from './TextLink'

const { profilePage } = route

type UserLinkProps = Omit<TextLinkProps, 'to'> & {
  userId: ID
  badgeSize?: IconSize
  popover?: boolean
  popoverMount?: MountPlacement
  noText?: boolean // Should be used if you're intending for the children to be the link element (i.e. Avatar)
  noBadges?: boolean
  // Hack to fix avatars wrapped in user link
  noOverflow?: boolean
}

export const UserLink = (props: UserLinkProps) => {
  const {
    userId,
    badgeSize = 's',
    popover,
    popoverMount,
    children,
    noText,
    noBadges,
    noOverflow,
    ...other
  } = props
  const { spacing } = useTheme()
  const { data: user } = useUser(userId, {
    select: (user) => ({
      handle: user?.handle,
      name: user?.name
    })
  })
  const { handle, name } = user ?? {}
  const url = handle ? profilePage(handle) : ''

  const textLink = (
    <TextLink
      to={url}
      css={{
        columnGap: spacing.xs,
        alignItems: 'center',
        lineHeight: 'normal'
      }}
      ellipses={popover}
      {...other}
    >
      <Text ellipses>{name}</Text>
      {noBadges ? null : (
        <UserBadges
          userId={userId}
          css={{ marginTop: spacing['2xs'] }}
          size={badgeSize}
        />
      )}
      {children}
    </TextLink>
  )
  const noTextLink = <Link to={url}>{children}</Link>
  const linkElement = noText ? noTextLink : textLink

  return popover && handle ? (
    <ArtistPopover
      css={{
        display: 'inline-flex',
        overflow: noOverflow ? 'visible' : 'hidden'
      }}
      handle={handle}
      component='span'
      mount={popoverMount}
    >
      {linkElement}
    </ArtistPopover>
  ) : (
    linkElement
  )
}
