import { chatActions } from '@audius/common/store'
import { useCallback } from 'react'

import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconTrash from 'app/assets/images/iconTrash.svg'
import { Text, Button } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles, flexRowCentered } from 'app/styles'
import { useColor } from 'app/utils/theme'

const { deleteChat } = chatActions

const DELETE_CHAT_MODAL_NAME = 'DeleteChat'

const messages = {
  title: 'Delete Conversation',
  description:
    'Are you sure you want to delete this conversation? \n\nOther people in the conversation will still be able to see it.  This can’t be undone.',
  deleteMessages: 'Are you sure you want to delete this chat?',
  deleteButton: 'Delete Conversation',
  cancel: 'Cancel'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    marginVertical: spacing(3),
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
    lineHeight: typography.fontSize.xl * 1.3
  },
  confirm: {
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.3,
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

export const DeleteChatDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')
  const dispatch = useDispatch()
  const { data } = useDrawer('DeleteChat')
  const { chatId } = data

  const closeDrawer = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'DeleteChat',
        visible: false
      })
    )
  }, [dispatch])

  const handleConfirmPress = useCallback(() => {
    if (chatId) {
      dispatch(deleteChat({ chatId }))
    }
    closeDrawer()
  }, [chatId, closeDrawer, dispatch])

  return (
    <NativeDrawer drawerName={DELETE_CHAT_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconTrash fill={neutralLight2} />
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <Text style={styles.confirm} allowNewline>
          {messages.description}
        </Text>
        <Button
          title={messages.deleteButton}
          onPress={handleConfirmPress}
          variant={'destructive'}
          styles={{
            root: styles.button,
            text: styles.blockText
          }}
          fullWidth
        />
        <Button
          title={messages.cancel}
          onPress={closeDrawer}
          variant={'common'}
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
