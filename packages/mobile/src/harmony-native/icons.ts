import type { IconProps as HarmonyIconProps } from '@audius/harmony'
import type { SvgProps } from 'react-native-svg'

export * from '@audius/harmony/src/icons'

export type IconProps = SvgProps & HarmonyIconProps & { fillSecondary?: string }

export type Icon = React.FC<IconProps>
