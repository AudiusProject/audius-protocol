import { useUSDCManualTransferModal } from '@audius/common/store'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import Drawer from 'app/components/drawer'
import { flexRowCentered, makeStyles } from 'app/styles'

import { USDCManualTransfer } from '../usdc-manual-transfer/USDCManualTransfer'

const messages = {
  title: 'Manual Crypto Transfer'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  drawer: {
    marginVertical: spacing(6),
    marginHorizontal: spacing(4),
    gap: spacing(6)
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    width: '100%',
    paddingBottom: spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  }
}))

export const USDCManualTransferDrawer = () => {
  const styles = useStyles()
  const { isOpen, onClose, onClosed } = useUSDCManualTransferModal()

  return (
    <Drawer isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <Text
            variant='label'
            weight='heavy'
            color='neutralLight2'
            fontSize='xl'
            textTransform='uppercase'
          >
            {messages.title}
          </Text>
        </View>
        <USDCManualTransfer onClose={onClose} />
      </View>
    </Drawer>
  )
}
