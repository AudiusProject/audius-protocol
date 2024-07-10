import { View } from 'react-native'
import { useSelector } from 'react-redux'

import type { ButtonProps } from '@audius/harmony-native'
import { IconArrowRight, Button } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import type { AppState } from 'app/store'
import { makeStyles } from 'app/styles'

const minSelectedArtistsCount = 3

const messages = {
  following: 'Following',
  continue: 'Continue'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    paddingHorizontal: spacing(6),
    backgroundColor: palette.white,
    paddingBottom: spacing(3)
  },
  button: {
    marginTop: spacing(4)
  },
  followCounter: {
    textAlign: 'center',
    marginTop: spacing(3)
  }
}))

type ContinueButtonProps = Partial<ButtonProps>

export const ContinueButton = (props: ContinueButtonProps) => {
  const styles = useStyles()
  const selectedUserIds = useSelector(
    (state: AppState) => state.signOn.followArtists.selectedUserIds
  )

  const followedArtistsCount = selectedUserIds.length
  const hasFollowedEnoughArtists =
    followedArtistsCount >= minSelectedArtistsCount

  return (
    <View style={styles.root}>
      <Button
        {...props}
        style={styles.button}
        fullWidth
        disabled={!hasFollowedEnoughArtists}
        iconRight={IconArrowRight}
      >
        {messages.continue}
      </Button>
      <Text fontSize='small' style={styles.followCounter}>
        {messages.following}{' '}
        {hasFollowedEnoughArtists
          ? followedArtistsCount
          : `${followedArtistsCount}/${minSelectedArtistsCount}`}
      </Text>
    </View>
  )
}
