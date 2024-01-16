import { Fragment, useState, useEffect, useRef, useCallback } from 'react'

import type { LayoutChangeEvent, TextStyle, ViewStyle } from 'react-native'
import { Animated, Pressable, View, Text } from 'react-native'

import { light } from 'app/haptics'
import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'

// Note, offset is the inner padding of the container div
const offset = 3

export type Option<Value> = {
  key: Value
  text: string
}

export type SegmentedControlProps<Value> = {
  // The options to display for the tab slider
  options: Array<Option<Value>>

  // Key of selected option
  selected?: Value

  // Key of initially selected option
  defaultSelected?: Value

  // Callback fired when new option is selected
  onSelectOption: (key: Value) => void

  fullWidth?: boolean
} & StylesProps<{
  root: ViewStyle
  tab: ViewStyle
  text: TextStyle
  activeText: TextStyle
}>

const springToValue = (
  animation: Animated.Value,
  value: number,
  finished?: () => void
) => {
  Animated.spring(animation, {
    toValue: value,
    tension: 160,
    friction: 15,
    useNativeDriver: false
  }).start(finished)
}

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  tabs: {
    borderRadius: 6,
    backgroundColor: palette.neutralLight7,
    flexDirection: 'row',
    alignItems: 'center',
    padding: offset,
    paddingRight: 0
  },
  tab: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    color: palette.neutral,
    fontSize: 13,
    fontFamily: typography.fontByWeight.demiBold
  },
  separator: {
    width: 1,
    backgroundColor: palette.neutralLight5,
    height: 15
  },
  hideSeparator: {
    opacity: 0
  },
  slider: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 4,
    backgroundColor: palette.white,
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 2
    }
  },
  fullWidth: {
    width: '100%'
  },
  tabFullWidth: {
    flexGrow: 1,
    textAlign: 'center'
  }
}))

export const SegmentedControl = <Value,>(
  props: SegmentedControlProps<Value>
) => {
  const {
    options,
    selected: selectedProp,
    defaultSelected = options[0].key,
    onSelectOption,
    fullWidth,
    style,
    styles: stylesProp
  } = props
  const styles = useStyles()
  const [optionWidths, setOptionWidths] = useState(options.map(() => 0))
  const [initLeft, setInitLeft] = useState(false)
  const leftAnim = useRef(new Animated.Value(0)).current
  const widthAnim = useRef(new Animated.Value(0)).current
  const [selected, setSelected] = useState(defaultSelected)
  const selectedOption = selectedProp ?? selected

  const handleSelectOption = (option: Value) => {
    light()
    onSelectOption?.(option)
    setSelected(option)
  }

  const getLeftValue = useCallback(() => {
    const selectedOptionIdx = options.findIndex(
      (option) => option.key === selectedOption
    )
    return optionWidths
      .slice(0, selectedOptionIdx)
      .reduce((totalWidth, width) => totalWidth + width, offset)
  }, [optionWidths, options, selectedOption])

  useEffect(() => {
    const selectedOptionIdx = options.findIndex(
      (option) => option.key === selectedOption
    )
    const width = optionWidths[selectedOptionIdx]
    const left = getLeftValue()

    springToValue(leftAnim, left)
    springToValue(widthAnim, width)
  }, [options, selectedOption, leftAnim, widthAnim, optionWidths, getLeftValue])

  // Watch for the options widths to be populated and then set the initial left value of the selector thumb
  useEffect(() => {
    if (!initLeft && optionWidths.every((val) => val !== 0)) {
      leftAnim.setValue(getLeftValue())
      setInitLeft(true)
    }
  }, [optionWidths, initLeft, options, leftAnim, selectedOption, getLeftValue])

  const setOptionWidth = (i: number) => (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout

    if (i === 0) {
      springToValue(leftAnim, offset)
      springToValue(widthAnim, width)
    }
    setOptionWidths([
      ...optionWidths.slice(0, i),
      width,
      ...optionWidths.slice(i + 1)
    ])

    // Set the width of the selector thumb to the width of the selected option
    if (options[i].key === selectedOption) {
      widthAnim.setValue(width)
    }
  }

  const sliderElement = (
    <Animated.View
      style={[styles.slider, { left: leftAnim, width: widthAnim }]}
    />
  )

  return (
    <View
      style={[
        styles.tabs,
        fullWidth && styles.fullWidth,
        style,
        stylesProp?.root
      ]}
    >
      {sliderElement}
      {options.map((option, index) => {
        const shouldHideSeparator =
          selectedOption === option.key ||
          // Hide separator right of the last option
          index === options.length - 1 ||
          // Hide separator right of an option if the next one is selected
          selectedOption === options[index + 1].key

        return (
          <Fragment key={option.text}>
            <Pressable
              onLayout={setOptionWidth(index)}
              style={[
                styles.tab,
                stylesProp?.tab,
                fullWidth && styles.tabFullWidth
              ]}
              onPress={() => handleSelectOption(option.key)}
            >
              <Text
                style={[
                  styles.text,
                  stylesProp?.text,
                  selectedOption === option.key && stylesProp?.activeText
                ]}
              >
                {option.text}
              </Text>
            </Pressable>
            <View
              style={[
                styles.separator,
                shouldHideSeparator && styles.hideSeparator
              ]}
            />
          </Fragment>
        )
      })}
    </View>
  )
}
