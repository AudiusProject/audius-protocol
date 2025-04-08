import type { ReactNode } from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  wallet: {
    flexBasis: '45%',
    marginTop: spacing(6),
    marginBottom: spacing(4),
    alignItems: 'center'
  },
  walletIcon: {
    display: 'flex',
    height: 64,
    width: 64,
    marginBottom: spacing(2)
  }
}))

type WalletOptionProps = {
  name: string
  icon: ReactNode
  onPress: () => void
}

export const WalletConnectOption = (props: WalletOptionProps) => {
  const { name, icon, onPress } = props
  const styles = useStyles()
  return (
    <TouchableOpacity style={styles.wallet} onPress={onPress}>
      <View style={styles.walletIcon}>{icon}</View>
      <Text fontSize='medium'>{name}</Text>
    </TouchableOpacity>
  )
}
