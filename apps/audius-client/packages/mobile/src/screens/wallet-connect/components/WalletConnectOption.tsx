import type { ReactNode } from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  wallet: {
    flexBasis: '25%',
    marginVertical: spacing(3),
    alignItems: 'center',
    justifyContent: 'center'
  },
  walletIcon: {
    display: 'flex',
    height: 50,
    width: 50,
    marginBottom: spacing(1)
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
