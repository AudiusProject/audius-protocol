import { useUser } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { route } from '@audius/common/utils'
import { IconSize, Text, useTheme } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges'
import UserBadgesV2 from 'components/user-badges/UserBadgesV2'

import { TextLink, TextLinkProps } from './TextLink'

const { profilePage } = route

type UserLinkProps = Omit<TextLinkProps, 'to'> & {
  userId: ID | undefined
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
  const { isEnabled: isWalletUIUpdate } = useFeatureFlag(
    FeatureFlags.WALLET_UI_UPDATE
  )

  const { data: partialUser } = useUser(userId, {
    select: (user) => {
      const { handle, name } = user ?? {}
      return { url: profilePage(handle), handle, name }
    }
  })
  const { url = '/', handle, name } = partialUser ?? {}

  if (!userId) {
    return null
  }

  // Prepare the user badges
  const badges = noBadges ? null : isWalletUIUpdate ? (
    <UserBadgesV2
      userId={userId}
      size={badgeSize}
      css={{ marginTop: spacing['2xs'] }}
    />
  ) : (
    <UserBadges
      userId={userId}
      size={badgeSize}
      css={{ marginTop: spacing['2xs'] }}
    />
  )

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
      {badges}
      {children}
    </TextLink>
  )
  const noTextLink = <Link to={url}>{children}</Link>
  const linkElement = noText ? noTextLink : textLink

  // In legacy UI, wrap the entire link element in ArtistPopover
  if (!isWalletUIUpdate && popover && handle) {
    return (
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
    )
  }

  // In new UI, wrap the text in ArtistPopover if needed
  if (isWalletUIUpdate && popover && handle) {
    return (
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
        <ArtistPopover
          css={{
            display: 'inline-flex',
            overflow: noOverflow ? 'visible' : 'hidden'
          }}
          handle={handle}
          component='span'
          mount={popoverMount}
        >
          <Text ellipses>{name}</Text>
        </ArtistPopover>
        {badges}
        {children}
      </TextLink>
    )
  }

  return linkElement
}
