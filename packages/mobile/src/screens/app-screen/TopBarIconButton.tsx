import type { IconButtonProps } from '@audius/harmony-native'
import { IconButton } from '@audius/harmony-native'

type TopBarIconButtonProps = IconButtonProps

export const TopBarIconButton = (props: TopBarIconButtonProps) => {
  return <IconButton color='subdued' size='m' {...props} />
}
