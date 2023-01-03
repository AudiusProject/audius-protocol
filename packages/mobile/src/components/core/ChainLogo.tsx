import type { Chain } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { makeStyles, shadow } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    height: spacing(6),
    width: spacing(6),
    borderRadius: spacing(6) / 2,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    backgroundColor: palette.staticWhite,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow()
  }
}))

export type ChainLogoProps = {
  chain: Chain
  style?: StyleProp<ViewStyle>
}

export const ChainLogo = (props: ChainLogoProps) => {
  const { chain, style } = props
  const styles = useStyles()

  return (
    <View style={[styles.root, style]}>
      {chain === 'eth' ? <LogoEth height={18} /> : <LogoSol height={16} />}
    </View>
  )
}
