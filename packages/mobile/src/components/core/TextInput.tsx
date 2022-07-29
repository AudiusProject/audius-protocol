import type { ComponentType } from 'react'
import { forwardRef, useCallback } from 'react'

import type {
  TextInputProps as RNTextInputProps,
  TextStyle,
  ViewStyle
} from 'react-native'
import { Animated, TextInput as RNTextInput, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import type { SvgProps } from 'react-native-svg'

import IconClose from 'app/assets/images/iconRemove.svg'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: spacing(2),
    paddingLeft: spacing(3),
    paddingRight: spacing(2),
    borderColor: palette.neutralLight7,
    backgroundColor: palette.neutralLight10
  },
  input: {
    flex: 1,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.medium,
    padding: 0
  },
  icon: {
    fill: palette.neutralLight5,
    height: spacing(4),
    width: spacing(4)
  },
  placeholderText: {
    color: palette.neutralLight4
  }
}))

export type TextInputProps = RNTextInputProps & {
  /**
   * Default icon to show at the right side of the input
   */
  Icon?: ComponentType<SvgProps>
  /**
   * Whether or not the search input should show a clear icon
   */
  clearable?: boolean
  /**
   * What happens when the user clicks the clear icon
   */
  onClear?: () => void
  styles?: StylesProp<{ root: ViewStyle; input: TextStyle }>
}

export type TextInputRef = RNTextInput

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (props, ref) => {
    const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.8)

    const {
      style,
      styles: stylesProp,
      Icon,
      clearable,
      onClear,
      ...other
    } = props
    const styles = useStyles()

    const handlePressIcon = useCallback(() => {
      onClear?.()
    }, [onClear])

    return (
      <View style={[styles.root, style, stylesProp?.root]}>
        <RNTextInput
          ref={ref}
          style={[styles.input, stylesProp?.input]}
          underlineColorAndroid='transparent'
          autoComplete='off'
          autoCorrect={false}
          returnKeyType='search'
          placeholderTextColor={styles.placeholderText.color}
          {...other}
        />
        {clearable ? (
          <Animated.View style={[{ transform: [{ scale }] }]}>
            <TouchableWithoutFeedback
              onPress={handlePressIcon}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              hitSlop={{
                top: spacing(2),
                bottom: spacing(2),
                left: spacing(2),
                right: spacing(2)
              }}
            >
              <IconClose
                style={{ height: styles.icon.height, width: styles.icon.width }}
                fill={styles.icon.fill}
                height={styles.icon.height}
                width={styles.icon.width}
              />
            </TouchableWithoutFeedback>
          </Animated.View>
        ) : Icon ? (
          <Icon
            style={{ height: styles.icon.height, width: styles.icon.width }}
            fill={styles.icon.fill}
            height={styles.icon.height}
            width={styles.icon.width}
          />
        ) : null}
      </View>
    )
  }
)
