import { ID } from '@audius/common/models'
import { Text, useTheme } from '@audius/harmony'

import { AppState } from 'store/types'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'

import { TextLink, TextLinkProps } from './TextLink'

type ServerUserLinkProps = Omit<TextLinkProps, 'to'> & {
  userId: ID
  popover?: boolean
}

// NOTE: Can't use user badges or user cache selectors bc it pulls in libs
export const ServerUserLink = (props: ServerUserLinkProps) => {
  const { userId, popover, children, ...other } = props
  const { spacing } = useTheme()

  const user = useSelector((state: AppState) => {
    return state.users.entries[userId].metadata
  })

  const url = user.handle ? profilePage(user.handle) : ''

  return (
    <TextLink
      to={url}
      css={{ columnGap: spacing.xs, alignItems: 'center' }}
      ellipses={popover}
      {...other}
    >
      <Text ellipses>{user.name}</Text>
      {children}
    </TextLink>
  )
}
