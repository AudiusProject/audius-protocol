import { useCallback } from 'react'

import { modalsActions, purchaseContentActions } from '@audius/common'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconCloseAlt from 'app/assets/images/iconCloseAlt.svg'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

import { AppDrawer } from '../drawer/AppDrawer'

import { StripeOnrampEmbed } from './StripeOnrampEmbed'

const { setVisibility } = modalsActions
const { cleanup } = purchaseContentActions

export const MODAL_NAME = 'StripeOnRamp'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    paddingTop: spacing(4)
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8,
    height: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing(4)
  },
  contentContainer: {
    paddingTop: spacing(6),
    flex: 1
  },
  exitContainer: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2)
  }
}))

const StripeOnrampDrawerHeader = ({ onClose }: { onClose: () => void }) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
        <IconCloseAlt
          width={spacing(6)}
          height={spacing(6)}
          fill={neutralLight4}
        />
      </TouchableOpacity>
    </View>
  )
}

export const StripeOnrampDrawer = () => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setVisibility({ modal: MODAL_NAME, visible: 'closing' }))
    dispatch(cleanup())
  }, [dispatch])

  return (
    <AppDrawer
      block
      drawerHeader={StripeOnrampDrawerHeader}
      zIndex={zIndex.STRIPE_ONRAMP_DRAWER}
      modalName={MODAL_NAME}
      drawerStyle={styles.root}
      isGestureSupported={false}
      isFullscreen
      onClose={handleClose}
    >
      <View style={styles.contentContainer}>
        <StripeOnrampEmbed />
      </View>
    </AppDrawer>
  )
}
