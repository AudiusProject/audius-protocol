import React, { useState, useEffect, useRef } from 'react'

import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TextStyle,
  View
} from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'

import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

// Note, offset is the inner padding of the container div
const OFFSET = 3

export type Option = {
  key: string
  text: string
}

export type TabSliderProps = {
  // The options to display for the tab slider
  options: Array<Option>

  // References the key of an available option that is selected
  selected: string

  // Called on select option
  onSelectOption: (key: string) => void

  fullWidth?: boolean

  /**
   * Styles specifically applied to slider tabs
   */
  tabStyle?: TextStyle

  /**
   * Styles specifically applied to slider text
   */
  textStyle?: TextStyle

  /**
   * Styles applied only to active cell text
   */
  activeTextStyle?: TextStyle
}

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

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    tabs: {
      marginLeft: 'auto',
      marginRight: 'auto',
      borderRadius: 6,
      backgroundColor: themeColors.neutralLight7,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: OFFSET,
      paddingRight: 0
    },
    tab: {
      elevation: 3,
      paddingTop: 10,
      paddingRight: 16,
      paddingBottom: 8,
      paddingLeft: 16,
      borderRadius: 4
    },
    text: {
      color: themeColors.neutral,
      fontSize: 13
    },
    separator: {
      width: 1,
      backgroundColor: themeColors.neutralLight5,
      height: 15
    },
    invisible: {
      opacity: 0
    },
    tabBackground: {
      position: 'absolute',
      elevation: 2,
      top: 3,
      bottom: 3,
      borderRadius: 4,
      backgroundColor: themeColors.white,
      shadowOpacity: 0.1,
      shadowOffset: {
        width: 0,
        height: 10
      }
    },
    fullWidth: {
      width: '100%'
    },
    tabFullWidth: {
      flex: 1,
      textAlign: 'center'
    }
  })

const TabSlider = (props: TabSliderProps) => {
  const styles = useThemedStyles(createStyles)
  const optionWidths = useRef<Array<number>>(props.options.map(() => 0))
  const [selected, setSelected] = useState(props.options[0].key)

  const selectedOption = props.selected || selected

  const onSetSelected = (option: string) => {
    // Call props function if controlled
    if (props.onSelectOption) props.onSelectOption(option)
    setSelected(option)
  }

  const leftAnim = useRef(new Animated.Value(0)).current
  const widthAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const selectedOptionIdx = props.options.findIndex(
      option => option.key === selectedOption
    )
    const width = optionWidths.current[selectedOptionIdx]
    const left = optionWidths.current
      .slice(0, selectedOptionIdx)
      .reduce((totalWidth, width) => totalWidth + width, OFFSET)

    springToValue(leftAnim, left)
    springToValue(widthAnim, width)
  }, [
    props.options,
    selectedOption,
    props.selected,
    selected,
    optionWidths,
    leftAnim,
    widthAnim
  ])

  const setOptionWidth = (i: number) => (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    if (i === 0) {
      springToValue(leftAnim, OFFSET)
      springToValue(widthAnim, width)
    }
    optionWidths.current[i] = width
  }

  return (
    <View style={[styles.tabs, ...(props.fullWidth ? [styles.fullWidth] : [])]}>
      <Animated.View
        style={[
          styles.tabBackground,
          {
            left: leftAnim,
            width: widthAnim
          }
        ]}
      />
      {props.options.map((option, idx) => {
        return (
          <React.Fragment key={option.key}>
            <TouchableWithoutFeedback
              onLayout={setOptionWidth(idx)}
              style={[
                styles.tab,
                ...(props.fullWidth ? [styles.tabFullWidth] : []),
                props.tabStyle,
                ...(selectedOption === option.key
                  ? [props.activeTextStyle]
                  : [])
              ]}
              onPress={() => onSetSelected(option.key)}
            >
              <Text weight='demiBold' style={[styles.text, props.textStyle]}>
                {option.text}
              </Text>
            </TouchableWithoutFeedback>
            <View
              style={[
                styles.separator,
                ...// Hide separator right of the selected option
                (selectedOption === option.key ||
                // Hide separator right of the last option
                idx === props.options.length - 1 ||
                // Hide separator right of an option if the next one is selected
                selectedOption === props.options[idx + 1].key
                  ? [styles.invisible]
                  : [])
              ]}
            />
          </React.Fragment>
        )
      })}
    </View>
  )
}

export default TabSlider
