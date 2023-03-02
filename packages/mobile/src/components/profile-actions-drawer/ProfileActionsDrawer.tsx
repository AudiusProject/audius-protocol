import { ShareSource, shareModalUIActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import type { AppState } from 'app/store'
import { getData } from 'app/store/drawers/selectors'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'
const { requestOpen: requestOpenShareModal } = shareModalUIActions

const PROFILE_ACTIONS_MODAL_NAME = 'ProfileActions'

const messages = {
  shareProfile: 'Share Profile',
  blockMessages: 'Block Messages'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    marginVertical: spacing(7),
    alignItems: 'center'
  },
  text: {
    fontSize: 21,
    lineHeight: spacing(6.5),
    letterSpacing: 0.233333,
    fontFamily: typography.fontByWeight.bold,
    color: palette.secondary,
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight9
  }
}))

export const ProfileActionsDrawer = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { userId } = useSelector((state: AppState) =>
    getData<'ProfileActions'>(state)
  )

  const handleShareProfilePress = () => {
    dispatch(
      setVisibility({
        drawer: 'ProfileActions',
        visible: false
      })
    )
    if (userId) {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.PAGE
        })
      )
    }
  }

  const handleBlockMessagesPress = () => {
    dispatch(
      setVisibility({
        drawer: 'ProfileActions',
        visible: false
      })
    )
    dispatch(
      setVisibility({
        drawer: 'BlockMessages',
        visible: true,
        data: { userId }
      })
    )
  }

  return (
    <NativeDrawer drawerName={PROFILE_ACTIONS_MODAL_NAME}>
      <View style={styles.drawer}>
        <Text style={styles.text} onPress={handleShareProfilePress}>
          {messages.shareProfile}
        </Text>
        <Text style={styles.text} onPress={handleBlockMessagesPress}>
          {messages.blockMessages}
        </Text>
      </View>
    </NativeDrawer>
  )
}
