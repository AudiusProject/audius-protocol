import { useCallback } from 'react'

import { deactivateAccount } from 'audius-client/src/pages/deactivate-account-page/store/slice'
import { StyleSheet, View } from 'react-native'

import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import ActionDrawer from '../action-drawer'

const MODAL_NAME = 'DeactivateAccountConfirmation'
const messages = {
  confirmTitle: 'Deactivate Account',
  confirm: 'Are you sure? This cannot be undone.',
  buttonDeactivate: 'Deactivate',
  buttonGoBack: 'Go Back'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    customDrawerTitle: {
      maxHeight: 500,
      borderBottomColor: themeColors.neutralLight8,
      borderBottomWidth: 1
    },
    customDrawerTitleHeader: {
      marginTop: 8,
      marginBottom: 16,
      textAlign: 'center',
      fontSize: 18
    },
    customDrawerTitleWarning: {
      paddingBottom: 24,
      textAlign: 'center',
      fontSize: 18,
      color: themeColors.accentRed
    }
  })

export const DeactivateAccountConfirmationDrawer = () => {
  const dispatchWeb = useDispatchWeb()
  const styles = useThemedStyles(createStyles)

  const handleConfirmation = useCallback(() => {
    dispatchWeb(deactivateAccount)
  }, [dispatchWeb])

  return (
    <ActionDrawer
      modalName={MODAL_NAME}
      rows={[
        {
          text: messages.buttonDeactivate,
          isDestructive: true,
          callback: handleConfirmation
        },
        {
          text: messages.buttonGoBack
        }
      ]}
      renderTitle={() => (
        <View style={styles.customDrawerTitle}>
          <Text weight={'bold'} style={styles.customDrawerTitleHeader}>
            {messages.confirmTitle}
          </Text>
          <Text weight={'demiBold'} style={styles.customDrawerTitleWarning}>
            {messages.confirm}
          </Text>
        </View>
      )}
    />
  )
}
