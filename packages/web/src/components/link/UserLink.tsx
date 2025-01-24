import { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconSize, Text, useTheme } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useSelector } from 'utils/reducer'

import { TextLink, TextLinkProps } from './TextLink'

const { profilePage } = route
const { getUser } = cacheUsersSelectors

type UserLinkProps = Omit<TextLinkProps, 'to'> & {
  userId: ID
  badgeSize?: IconSize
  popover?: boolean
  popoverMount?: MountPlacement
  noText?: boolean // Should be used if you're intending for the children to be the link element (i.e. Avatar)
  noBadges?: boolean
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
    ...other
  } = props
  const { spacing } = useTheme()

  const url = useSelector((state) => {
    const handle = getUser(state, { id: userId })?.handle
    return handle ? profilePage(handle) : ''
  })

  const handle = useSelector((state) => getUser(state, { id: userId })?.handle)
  const userName = useSelector((state) => getUser(state, { id: userId })?.name)

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
      <Text ellipses>{userName}</Text>
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
      css={{ display: 'inline-flex', overflow: 'hidden' }}
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
