import { useCallback } from 'react'

import { modalsActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

import { AppDrawer } from '../drawer/AppDrawer'

import { StripeOnrampEmbed } from './StripeOnrampEmbed'

const { setVisibility } = modalsActions

export const MODAL_NAME = 'StripeOnRamp'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingTop: spacing(4)
  },
  exitContainer: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2)
  }
}))

export const StripeOnrampDrawer = () => {
  const styles = useStyles()
  const neutralLight4 = useColor('neutralLight4')
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setVisibility({ modal: MODAL_NAME, visible: 'closing' }))
  }, [dispatch])

  return (
    <AppDrawer
      zIndex={zIndex.STRIPE_ONRAMP_DRAWER}
      modalName={MODAL_NAME}
      drawerStyle={styles.root}
    >
      <View style={styles.exitContainer}>
        <IconRemove
          fill={neutralLight4}
          width={spacing(6)}
          height={spacing(6)}
          onPress={handleClose}
        />
      </View>
      <StripeOnrampEmbed />
    </AppDrawer>
  )
}
