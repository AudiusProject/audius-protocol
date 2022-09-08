import { useCallback } from 'react'

import { accountSelectors, challengesSelectors } from '@audius/common'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconValidationCheck from 'app/assets/images/iconValidationCheck.svg'
import Text from 'app/components/text'
import { useNavigation } from 'app/hooks/useNavigation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ProfileTabScreenParamList } from 'app/screens/app-screen/ProfileTabScreen'
import type { ThemeColors } from 'app/utils/theme'

import Button, { ButtonType } from '../button'
const { getCompletionStages } = challengesSelectors
const { getAccountUser } = accountSelectors

const messages = {
  profileCheckNameAndHandle: 'Name & Handle',
  profileCheckProfilePicture: 'Profile Picture',
  profileCheckCoverPhoto: 'Cover Photo',
  profileCheckProfileDescription: 'Profile Description',
  profileCheckFavorite: 'Favorite Track/Playlist',
  profileCheckRepost: 'Repost Track/Playlist',
  profileCheckFollow: 'Follow Five People',

  profileCompletionButton: 'Your Profile'
}
const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
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
      borderColor: themeColors.neutralLight4
    }
  })
const renderArrowIcon = (color) => <IconArrow fill={color} />

export const ProfileCompletionChecks = ({
  isComplete,
  onClose
}: {
  isComplete: boolean
  onClose: () => void
}) => {
  const currentUser = useSelector(getAccountUser)
  const completionStages = useSelector(getCompletionStages)
  const styles = useThemedStyles(createStyles)
  const navigation = useNavigation<ProfileTabScreenParamList>()
  const goToProfile = useCallback(() => {
    onClose()
    if (currentUser?.handle) {
      navigation.goBack()
    }
  }, [currentUser, onClose, navigation])

  if (!currentUser || !currentUser?.handle) {
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
        title={messages.profileCompletionButton}
        renderIcon={renderArrowIcon}
        iconPosition='right'
        onPress={goToProfile}
        type={isComplete ? ButtonType.COMMON : ButtonType.PRIMARY}
      />
    </View>
  )
}
