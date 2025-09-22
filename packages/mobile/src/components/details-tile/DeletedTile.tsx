import type { ReactNode } from 'react'

import type { SearchUser, User } from '@audius/common/models'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { Button, Flex, IconUser, Paper, Text } from '@audius/harmony-native'
import { UserBadges } from 'app/components/user-badges'

const messages = {
  deleted: '[deleted by artist]',
  moreBy: (artistName: string | undefined) => `More by ${artistName}`
}

export const DeletedTile = ({
  headerText,
  title,
  user,
  imageElement,
  handlePressArtistName
}: {
  headerText?: string
  user?: User | SearchUser
  title: string
  username?: string
  imageElement: ReactNode | ReactNode[]
  handlePressArtistName: () => void
}) => {
  return (
    <Paper alignItems='center' p='l' gap='l' w='100%'>
      <Text variant='label' color='subdued' style={{ letterSpacing: 2 }}>
        {headerText} {messages.deleted}
      </Text>
      {imageElement}
      <Flex gap='xs' alignItems='center'>
        <Text variant='heading' size='s'>
          {title}
        </Text>
        {user ? (
          <TouchableOpacity onPress={handlePressArtistName}>
            <Flex direction='row' gap='xs'>
              <Text variant='body' color='accent' size='l'>
                {user.name}
              </Text>
              <UserBadges userId={user.user_id} badgeSize='s' />
            </Flex>
          </TouchableOpacity>
        ) : null}
      </Flex>
      <Button
        variant='secondary'
        iconLeft={IconUser}
        onPress={handlePressArtistName}
        fullWidth
      >
        {messages.moreBy(user?.name)}
      </Button>
    </Paper>
  )
}
