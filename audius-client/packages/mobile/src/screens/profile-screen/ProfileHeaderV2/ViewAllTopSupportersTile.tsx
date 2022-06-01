import { useCallback } from 'react'

import { User } from 'audius-client/src/common/models/User'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Tile, TextButton } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { ProfilePictureList } from 'app/screens/notifications-screen/Notification'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(3),
    paddingBottom: spacing(1),
    marginRight: spacing(2)
  },
  content: {
    paddingTop: spacing(4),
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(2),
    alignItems: 'center'
  },
  profilePictureList: {
    marginBottom: spacing(3),
    marginRight: spacing(2)
  }
}))

const messages = {
  viewAll: 'View All'
}

type ViewAllTopSupportersTileProps = {
  supporters: User[]
}

export const ViewAllTopSupportersTile = (
  props: ViewAllTopSupportersTileProps
) => {
  const { user_id } = useSelectProfile(['user_id'])
  const { supporters } = props
  const styles = useStyles()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'TopSupporters', params: { userId: user_id } }
    })
  }, [navigation, user_id])

  return (
    <Tile
      styles={{
        root: styles.root,
        content: styles.content
      }}
      onPress={handlePress}
    >
      <ProfilePictureList
        users={supporters}
        style={styles.profilePictureList}
        navigationType='push'
        interactive={false}
      />
      <TextButton
        disabled
        showDisabled={false}
        variant='neutralLight4'
        icon={IconArrow}
        iconPosition='right'
        title={messages.viewAll}
        TextProps={{ fontSize: 'small', weight: 'bold' }}
      />
    </Tile>
  )
}
