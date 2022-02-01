import { StyleSheet } from 'react-native'

import IconRepostOffDark from 'app/assets/animations/iconRepostTrackTileOffDark.json'
import IconRepostOffLight from 'app/assets/animations/iconRepostTrackTileOffLight.json'
import IconRepostOnDark from 'app/assets/animations/iconRepostTrackTileOnDark.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostTrackTileOnLight.json'
import AnimatedButtonProvider, {
  AnimatedButtonProviderProps
} from 'app/components/animated-button/AnimatedButtonProvider'
import { Theme, useThemeVariant } from 'app/utils/theme'

const styles = StyleSheet.create({
  icon: {
    height: 22,
    width: 22
  }
})

type RepostButtonProps = Omit<
  AnimatedButtonProviderProps,
  'iconLightJSON' | 'iconDarkJSON' | 'isDarkMode'
>

const RepostButton = ({ isActive, ...props }: RepostButtonProps) => {
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  return (
    <AnimatedButtonProvider
      {...props}
      iconIndex={isActive ? 1 : 0}
      isDarkMode={isDarkMode}
      iconLightJSON={[IconRepostOnLight, IconRepostOffLight]}
      iconDarkJSON={[IconRepostOnDark, IconRepostOffDark]}
      wrapperStyle={[
        styles.icon,
        props.isDisabled ? { opacity: 0.5 } : {},
        props.wrapperStyle
      ]}
    />
  )
}

export default RepostButton
