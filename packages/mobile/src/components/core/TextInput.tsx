import type { ComponentType, ReactNode } from 'react'
import {
  useMemo,
  useState,
  useRef,
  forwardRef,
  useCallback,
  useEffect
} from 'react'

import { BlurView } from '@react-native-community/blur'
import type {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputProps as RNTextInputProps,
  TextStyle,
  ViewStyle
} from 'react-native'
import {
  Platform,
  Keyboard,
  InputAccessoryView,
  Animated,
  TextInput as RNTextInput,
  View,
  Pressable
} from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import type { SvgProps } from 'react-native-svg'

import { IconCloseAlt } from '@audius/harmony-native'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { convertHexToRGBA } from 'app/utils/convertHexToRGBA'
import { mergeRefs } from 'app/utils/mergeRefs'
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme'

import { TextButton } from './TextButton'

const messages = {
  done: 'Done'
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 2,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: spacing(2),
    paddingLeft: spacing(3),
    paddingRight: spacing(2),
    borderColor: palette.neutralLight7,
    backgroundColor: palette.neutralLight10
  },
  labelRoot: {
    paddingTop: spacing(8),
    paddingBottom: spacing(3)
  },
  label: {
    position: 'absolute',
    left: spacing(3),
    top: spacing(2)
  },
  labelText: {
    color: palette.neutral,
    fontFamily: typography.fontByWeight.medium
  },
  input: {
    flex: 1,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.medium,
    minWidth: 40,
    flexGrow: 1,
    // Needed for android
    padding: 0
  },
  icon: {
    fill: palette.neutralLight5,
    width: spacing(4),
    height: spacing(4)
  },
  placeholderText: {
    color: palette.neutralLight7
  },
  startAdornment: {},
  endAdornment: {
    alignSelf: 'flex-end'
  },
  inputAccessory: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  doneButton: {
    marginRight: spacing(4),
    marginVertical: spacing(3)
  }
}))

export type TextInputProps = RNTextInputProps & {
  // Needed to set up accessibility
  id?: string
  label?: string
  /**
   * Default icon to show at the right side of the input
   */
  Icon?: ComponentType<SvgProps>
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  /**
   * Whether or not the search input should show a clear icon
   */
  clearable?: boolean
  /**
   * What happens when the user clicks the clear icon
   */
  onClear?: () => void
  styles?: StylesProp<{
    root: ViewStyle
    input: TextStyle
    labelText: TextStyle
  }>
  iconProp?: Pick<SvgProps, 'fill' | 'width' | 'height'>
  hideInputAccessory?: boolean
  hideKeyboard?: boolean
  error?: boolean
  TextInputComponent?: typeof RNTextInput
}

export type TextInputRef = RNTextInput

const activeLabelY = 0
const inactiveLabelY = spacing(3)
const inputAccessoryViewID = 'audiusInputAccessoryView'

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (props, ref) => {
    const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.8)
    const innerInputRef = useRef<RNTextInput>()

    const {
      id,
      style,
      styles: stylesProp,
      label,
      Icon,
      iconProp,
      clearable,
      onClear,
      startAdornment,
      endAdornment,
      value,
      onFocus,
      onBlur,
      placeholder,
      hideInputAccessory: hideInputAccessoryProp,
      autoCorrect = false,
      error,
      TextInputComponent = RNTextInput,
      ...other
    } = props
    const { autoFocus, returnKeyType, hideKeyboard } = other
    const styles = useStyles()

    const [isFocused, setIsFocused] = useState(Boolean(autoFocus))
    const isLabelActive = isFocused || !!value || !!startAdornment
    const labelY = useRef(
      new Animated.Value(isLabelActive ? activeLabelY : inactiveLabelY)
    )

    const labelAnimation = useRef(new Animated.Value(isLabelActive ? 16 : 18))
    const borderFocusAnimation = useMemo(
      () => new Animated.Value(isFocused ? 1 : 0),
      [isFocused]
    )
    const iconProps = { ...styles.icon, ...iconProp }

    const hideInputAccessory =
      (hideInputAccessoryProp ?? returnKeyType === 'search') ||
      Platform.OS === 'android'

    // Trigger label animation on mount if value is prefilled
    useEffect(() => {
      if (isLabelActive) {
        const labelYAnimation = Animated.spring(labelY.current, {
          toValue: activeLabelY,
          useNativeDriver: true
        })

        const labelFontSizeAnimation = Animated.spring(labelAnimation.current, {
          toValue: 16,
          useNativeDriver: false
        })

        const animations = [labelYAnimation, labelFontSizeAnimation]
        Animated.parallel(animations).start()
      }
    }, [isLabelActive])

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        onFocus?.(e)
        setIsFocused(true)
        if (hideKeyboard) {
          Keyboard.dismiss()
        }

        let animations: Animated.CompositeAnimation[] = []

        const borderFocusCompositeAnim = Animated.spring(borderFocusAnimation, {
          toValue: 1,
          useNativeDriver: false
        })

        animations.push(borderFocusCompositeAnim)

        if (!isLabelActive) {
          const labelYAnimation = Animated.spring(labelY.current, {
            toValue: activeLabelY,
            useNativeDriver: true
          })

          const labelFontSizeAnimation = Animated.spring(
            labelAnimation.current,
            {
              toValue: 16,
              useNativeDriver: false
            }
          )

          animations = animations.concat([
            labelYAnimation,
            labelFontSizeAnimation
          ])
        }

        Animated.parallel(animations).start()
      },
      [onFocus, hideKeyboard, borderFocusAnimation, isLabelActive]
    )

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        onBlur?.(e)
        setIsFocused(false)

        let animations: Animated.CompositeAnimation[] = []

        const borderFocusCompositeAnim = Animated.spring(borderFocusAnimation, {
          toValue: 0,
          useNativeDriver: false
        })

        animations.push(borderFocusCompositeAnim)

        if (isFocused && !value && !startAdornment) {
          const labelYAnimation = Animated.spring(labelY.current, {
            toValue: inactiveLabelY,
            useNativeDriver: true
          })

          const labelFontSizeAnimation = Animated.spring(
            labelAnimation.current,
            {
              toValue: 18,
              useNativeDriver: false
            }
          )

          animations = animations.concat([
            labelYAnimation,
            labelFontSizeAnimation
          ])
        }
        Animated.parallel(animations).start()
      },
      [onBlur, borderFocusAnimation, isFocused, value, startAdornment]
    )

    const handlePressRoot = useCallback(() => {
      if (!isFocused) {
        innerInputRef.current?.focus()
      }
    }, [isFocused])

    const handlePressIcon = useCallback(() => {
      onClear?.()
    }, [onClear])

    const { neutral, neutralLight4, secondary, neutralLight7, accentRed } =
      useThemeColors()

    const themeVariant = useThemeVariant()

    return (
      <Pressable onPress={handlePressRoot}>
        <Animated.View
          style={[
            styles.root,
            label ? styles.labelRoot : undefined,
            style,
            stylesProp?.root,
            {
              borderColor: error
                ? accentRed
                : borderFocusAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      convertHexToRGBA(neutralLight7),
                      convertHexToRGBA(secondary)
                    ]
                  })
            }
          ]}
        >
          {label ? (
            <Animated.View
              style={[
                styles.label,
                { transform: [{ translateY: labelY.current }] }
              ]}
            >
              <Animated.Text
                nativeID={id}
                style={[
                  styles.labelText,
                  stylesProp?.labelText,
                  {
                    fontSize: labelAnimation.current,
                    color: labelAnimation.current.interpolate({
                      inputRange: [16, 18],
                      outputRange: [
                        convertHexToRGBA(neutralLight4),
                        convertHexToRGBA(neutral)
                      ]
                    })
                  }
                ]}
              >
                {label}
              </Animated.Text>
            </Animated.View>
          ) : null}
          {startAdornment ? (
            <View style={styles.startAdornment}>{startAdornment}</View>
          ) : null}
          <TextInputComponent
            ref={mergeRefs([innerInputRef, ref])}
            style={[styles.input, stylesProp?.input]}
            accessibilityLabel={Platform.OS === 'ios' ? label : undefined}
            accessibilityLabelledBy={Platform.OS === 'android' ? id : undefined}
            underlineColorAndroid='transparent'
            autoComplete='off'
            autoCorrect={autoCorrect}
            selectionColor={secondary}
            placeholderTextColor={styles.placeholderText.color}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            showSoftInputOnFocus={!hideKeyboard}
            placeholder={
              label && !isFocused && !startAdornment ? undefined : placeholder
            }
            inputAccessoryViewID={
              hideInputAccessory ? undefined : inputAccessoryViewID
            }
            {...other}
          />
          {clearable && value ? (
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
                <IconCloseAlt
                  fill={iconProps.fill}
                  height={iconProps.height}
                  width={iconProps.width}
                />
              </TouchableWithoutFeedback>
            </Animated.View>
          ) : Icon ? (
            <Icon
              fill={iconProps.fill}
              height={iconProps.height}
              width={iconProps.width}
            />
          ) : null}
          {endAdornment ? (
            <View style={styles.endAdornment}>{endAdornment}</View>
          ) : null}
        </Animated.View>
        {hideInputAccessory ? null : (
          <InputAccessoryView nativeID={inputAccessoryViewID}>
            <BlurView
              blurType={
                themeVariant === Theme.DEFAULT
                  ? 'thinMaterialLight'
                  : 'thinMaterialDark'
              }
              blurAmount={20}
              style={styles.inputAccessory}
            >
              <TextButton
                variant='secondary'
                title={messages.done}
                TextProps={{ fontSize: 'large', weight: 'demiBold' }}
                style={styles.doneButton}
                onPress={Keyboard.dismiss}
              />
            </BlurView>
          </InputAccessoryView>
        )}
      </Pressable>
    )
  }
)
