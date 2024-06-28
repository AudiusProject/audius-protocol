import { useCallback, useEffect, useState } from 'react'

import { useControlled } from '@audius/harmony/src/hooks/useControlled'
import type { ReactNativeStyle } from '@emotion/native'
import { useTheme } from '@emotion/react'

import { IconCloseAlt, Text } from '@audius/harmony-native'

import { BaseButton } from '../BaseButton/BaseButton'

import type { FilterButtonProps } from './types'

export const FilterButton = (props: FilterButtonProps) => {
  const {
    value: valueProp,
    label: labelProp,
    onPress,
    onOpen,
    onReset,
    disabled,
    variant = 'fillContainer',
    size = 'default',
    iconRight
  } = props

  const { color, cornerRadius, spacing, typography } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const [value, setValue] = useControlled({
    controlledProp: valueProp,
    defaultValue: null,
    stateName: 'value',
    componentName: 'FilterButton'
  })

  const [label, setLabel] = useControlled({
    controlledProp: labelProp,
    defaultValue: null,
    stateName: 'label',
    componentName: 'FilterButton'
  })

  // Size Styles
  const defaultStyles: ReactNativeStyle = {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s
  }
  const defaultIconStyles: ReactNativeStyle = {
    width: spacing.unit4,
    height: spacing.unit4
  }

  const smallStyles: ReactNativeStyle = {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs
  }
  const smallIconStyles: ReactNativeStyle = {
    width: spacing.unit3,
    height: spacing.unit3
  }

  // TODO: Update these are the button styles to use animated styles for the background, border, text, and icon
  // State Styles
  const fillContainerStyles: ReactNativeStyle = {
    backgroundColor: color.secondary.s400,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: color.secondary.s400
  }

  const activeStyle: ReactNativeStyle =
    variant !== 'fillContainer' || value === null
      ? {
          backgroundColor: color.background.surface2,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: color.border.strong
        }
      : {}

  // Button Styles
  const buttonStyles: ReactNativeStyle = {
    backgroundColor: color.background.white,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: color.border.strong,
    borderRadius: cornerRadius.s,
    color:
      variant === 'fillContainer' && value !== null
        ? color.static.white
        : color.text.default,
    gap: spacing.xs,
    fontSize: typography.size.s,
    fontWeight: '600',
    lineHeight: typography.lineHeight.s,
    opacity: disabled ? 0.6 : 1,

    ...(size === 'small' ? smallStyles : defaultStyles),
    ...(isOpen ? activeStyle : {}),
    ...(variant === 'fillContainer' && value !== null
      ? fillContainerStyles
      : {})
  }

  const iconStyles = size === 'small' ? smallIconStyles : defaultIconStyles

  useEffect(() => {
    if (isOpen) {
      onOpen?.()
    }
  }, [isOpen, onOpen])

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress()
    } else {
      if (variant === 'fillContainer' && value !== null) {
        setValue(null)
        setLabel(null)
        onReset?.()
      } else {
        setIsOpen((isOpen: boolean) => !isOpen)
      }
    }
  }, [onPress, onReset, setLabel, setValue, value, variant])

  const iconSize = size === 'small' ? 's' : 'm'
  const textColor =
    value !== null && variant === 'fillContainer' ? 'staticWhite' : 'default'

  return (
    <BaseButton
      style={buttonStyles}
      styles={{ icon: iconStyles }}
      innerProps={{
        icon: {
          color: 'staticWhite',
          size: iconSize
        }
      }}
      onPress={handlePress}
      iconRight={
        variant === 'fillContainer' && value !== null ? IconCloseAlt : iconRight
      }
      disabled={disabled}
      aria-haspopup='listbox'
      aria-expanded={isOpen}
    >
      <Text color={textColor}>{label}</Text>
    </BaseButton>
  )
}
