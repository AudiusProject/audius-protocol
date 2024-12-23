import { useCallback } from 'react'

import { accountSelectors, challengesSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import {
  Button,
  IconArrowRight,
  IconValidationCheck
} from '@audius/harmony-native'
import Text from 'app/components/text'
import { useNavigation } from 'app/hooks/useNavigation'
import type { ProfileTabScreenParamList } from 'app/screens/app-screen/ProfileTabScreen'
import { makeStyles } from 'app/styles'

const { getCompletionStages } = challengesSelectors
const { getUserHandle } = accountSelectors

const messages = {
  profileCheckNameAndHandle: 'Name & Handle',
  profileCheckProfilePicture: 'Profile Picture',
  profileCheckCoverPhoto: 'Cover Photo',
  profileCheckProfileDescription: 'Profile Description',
  profileCheckFavorite: 'Favorite Track/Playlist',
  profileCheckRepost: 'Repost Track/Playlist',
  profileCheckFollow: 'Follow Five People',

  profileCompletionButton: 'View Your Profile'
}
const useStyles = makeStyles(({ palette }) => ({
  columnContainer: {
    marginBottom: 32,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  checkContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexBasis: '50%',
    marginBottom: 1
  },
  checkText: {
    marginLeft: 8
  },
  checkTextDone: {
    textDecorationLine: 'line-through'
  },
  checkCircle: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.neutralLight4
  }
}))

export const ProfileCompletionChecks = ({
  isComplete,
  onClose
}: {
  isComplete: boolean
  onClose: () => void
}) => {
  const currentUserHandle = useSelector(getUserHandle)
  const completionStages = useSelector(getCompletionStages)
  const styles = useStyles()
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const goToProfile = useCallback(() => {
    onClose()
    if (currentUserHandle) {
      navigation.navigate('Profile', { handle: currentUserHandle })
    }
  }, [currentUserHandle, onClose, navigation])

  if (!currentUserHandle || !currentUserHandle) {
    return null
  }
  const config: Record<string, boolean> = {
    [messages.profileCheckNameAndHandle]: completionStages.hasNameAndHandle,
    [messages.profileCheckProfilePicture]: completionStages.hasProfilePicture,
    [messages.profileCheckCoverPhoto]: completionStages.hasCoverPhoto,
    [messages.profileCheckProfileDescription]:
      completionStages.hasProfileDescription,
    [messages.profileCheckFavorite]: completionStages.hasFavoritedItem,
    [messages.profileCheckRepost]: !!completionStages.hasReposted,
    [messages.profileCheckFollow]: completionStages.hasFollowedAccounts
  }
  return (
    <View>
      <View style={styles.columnContainer}>
        {Object.keys(config).map((key) => (
          <View key={key} style={styles.checkContainer}>
            {config[key] ? (
              <IconValidationCheck fill={'white'} />
            ) : (
              <View style={styles.checkCircle} />
            )}
            <Text
              style={[
                styles.checkText,
                config[key] ? styles.checkTextDone : {}
              ]}
            >
              {key}
            </Text>
          </View>
        ))}
      </View>
      <Button
        variant={isComplete ? 'secondary' : 'primary'}
        iconRight={IconArrowRight}
        onPress={goToProfile}
      >
        {messages.profileCompletionButton}
      </Button>
    </View>
  )
}
