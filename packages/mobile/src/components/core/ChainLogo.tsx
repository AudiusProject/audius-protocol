import type { Chain } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { makeStyles, shadow } from 'app/styles'

const useStyles = makeStyles(({ palette }) => ({
  root: {
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
  size?: number
}

export const ChainLogo = (props: ChainLogoProps) => {
  const { chain, style, size = 24 } = props
  const styles = useStyles()
  const rootStyle = [
    styles.root,
    style,
    { height: size, width: size, borderRadius: size / 2 }
  ]

  const solIconSize = size * (2 / 3)
  const ethIconSize = solIconSize * (9 / 8)

  return (
    <View style={rootStyle}>
      {chain === 'eth' ? (
        <LogoEth height={ethIconSize} />
      ) : (
        <LogoSol height={solIconSize} />
      )}
    </View>
  )
}
