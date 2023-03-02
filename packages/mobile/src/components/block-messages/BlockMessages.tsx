import { cacheUsersSelectors } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconBlockMessages from 'app/assets/images/iconBlockMessages.svg'
import IconInfo from 'app/assets/images/iconInfo.svg'
import { Text, Button } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import type { AppState } from 'app/store'
import { getData } from 'app/store/drawers/selectors'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const { getUser } = cacheUsersSelectors

const BLOCK_MESSAGES_MODAL_NAME = 'BlockMessages'

const messages = {
  title: 'Are you sure?',
  confirmText1: 'Are you sure you want to block ',
  confirmText2: ' from sending messages to your inbox?',
  info: 'This will not affect their ability to view your profile or interact with your content.',
  blockUser: 'Block User',
  cancel: 'Cancel'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    marginVertical: spacing(6.5),
    padding: spacing(3.5),
    gap: spacing(4)
  },
  titleContainer: {
    ...flexRowCentered(),
    gap: spacing(3.5),
    marginBottom: spacing(2),
    alignSelf: 'center'
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight2,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.xl * 1.25
  },
  confirm: {
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.5,
    color: palette.neutral
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    backgroundColor: palette.neutralLight9,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2)
  },
  infoText: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.fontSize.medium * 1.375,
    marginRight: spacing(12)
  },
  infoIcon: {
    width: spacing(5),
    height: spacing(5),
    color: palette.neutral
  },
  button: {
    padding: spacing(4),
    height: spacing(12)
  },
  blockButton: {
    borderColor: palette.accentRed
  },
  blockText: {
    fontSize: typography.fontSize.large
  }
}))

export const BlockMessagesDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')
  const neutral = useColor('neutral')
  const dispatch = useDispatch()
  const { userId } = useSelector((state: AppState) =>
    getData<'BlockMessages'>(state)
  )
  const user = useSelector((state) => getUser(state, { id: userId }))

  const handleConfirmPress = () => {
    dispatch(
      setVisibility({
        drawer: 'BlockMessages',
        visible: false
      })
    )
  }

  const handleCancelPress = () => {
    dispatch(
      setVisibility({
        drawer: 'BlockMessages',
        visible: false
      })
    )
  }

  return (
    <NativeDrawer drawerName={BLOCK_MESSAGES_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconBlockMessages fill={neutralLight2} />
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <Text style={styles.confirm}>
          {messages.confirmText1}
          {user?.name}
          {messages.confirmText2}
        </Text>
        <View style={styles.infoContainer}>
          <IconInfo
            style={styles.infoIcon}
            fill={neutral}
            height={spacing(5)}
            width={spacing(5)}
          />
          <Text style={styles.infoText}>{messages.info}</Text>
        </View>
        <Button
          title={messages.blockUser}
          onPress={handleConfirmPress}
          variant='destructive'
          styles={{
            root: styles.button,
            text: styles.blockText
          }}
          fullWidth
        />
        <Button
          title={messages.cancel}
          onPress={handleCancelPress}
          variant='primary'
          styles={{
            root: styles.button,
            text: styles.blockText
          }}
          fullWidth
        />
      </View>
    </NativeDrawer>
  )
}
