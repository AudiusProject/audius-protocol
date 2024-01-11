import {
  forwardRef,
  RefObject,
  useRef,
  useState,
  useCallback,
  useEffect
} from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { BaseButton } from 'components/button/BaseButton/BaseButton'
import { Box, Flex, Paper, Popup } from 'components/layout'
import { IconCaretDown, IconCloseAlt } from 'icons'

import { FilterButtonOption, FilterButtonProps } from '../types'

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  function FilterButton(props, ref) {
    const {
      initialSelectionIndex,
      label,
      options,
      onSelect,
      variant = 'fillContainer',
      size = 'default',
      iconRight = IconCaretDown,
      popupAnchorOrigin,
      popupTransformOrigin,
      popupPortalLocation,
      popupZIndex
    } = props
    const { color, cornerRadius, spacing, typography } = useTheme()
    const [selection, setSelection] = useState<FilterButtonOption | null>(
      initialSelectionIndex !== undefined
        ? options[initialSelectionIndex]
        : null
    )

    useEffect(() => {
      if (onSelect && selection?.label) {
        onSelect(selection.label)
      }
    }, [selection?.label, onSelect])

    const [isOpen, setIsOpen] = useState(false)

    // Size Styles
    const defaultStyles: CSSObject = {
      paddingLeft: spacing.m,
      paddingRight: spacing.m,
      paddingTop: spacing.s,
      paddingBottom: spacing.s
    }
    const defaultIconStyles: CSSObject = {
      width: spacing.unit4,
      height: spacing.unit4
    }

    const smallStyles: CSSObject = {
      paddingLeft: spacing.m,
      paddingRight: spacing.m,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs
    }
    const smallIconStyles: CSSObject = {
      width: spacing.unit3,
      height: spacing.unit3
    }

    const fillContainerStyles: CSSObject = {
      background: color.secondary.s400,
      border: `1px solid ${color.secondary.s400}`,
      '&:hover': {
        border: `1px solid ${color.secondary.s400}`,
        transform: 'none'
      }
    }

    const activeStyle =
      variant !== 'fillContainer' || selection === null
        ? {
            border: `1px solid ${color.border.strong}`,
            background: color.background.surface2
          }
        : {}

    // Button Styles
    const buttonCss: CSSObject = {
      background: 'transparent',
      border: `1px solid ${color.border.strong}`,
      borderRadius: cornerRadius.s,
      color:
        variant === 'fillContainer' && selection !== null
          ? color.special.white
          : color.text.default,
      gap: spacing.xs,
      fontSize: typography.size.s,
      fontWeight: typography.weight.demiBold,
      lineHeight: typography.lineHeight.s,

      '&:hover': {
        border: `1px solid ${color.neutral.n800}`,
        transform: 'none'
      },

      '&:active': {
        ...activeStyle,
        transform: 'none'
      },

      ...(size === 'small' ? smallStyles : defaultStyles),
      ...(isOpen ? activeStyle : {}),
      ...(variant === 'fillContainer' && selection !== null
        ? fillContainerStyles
        : {})
    }

    const iconCss = size === 'small' ? smallIconStyles : defaultIconStyles

    // Popup Styles
    const optionCss: CSSObject = {
      background: 'transparent',
      border: 'none',
      color: color.text.default,
      fontWeight: typography.weight.medium,
      gap: spacing.s,
      paddingLeft: spacing.m,
      paddingRight: spacing.m,
      paddingTop: spacing.s,
      paddingBottom: spacing.s,
      width: '100%',
      borderRadius: cornerRadius.s,
      justifyContent: 'flex-start',

      '&:hover': {
        transform: 'none',
        backgroundColor: color.secondary.s300,
        color: color.special.white
      },

      '&:active': {
        transform: 'none'
      }
    }
    const optionIconCss: CSSObject = {
      width: spacing.unit4,
      height: spacing.unit4
    }

    const handleButtonClick = useCallback(() => {
      if (variant === 'fillContainer' && selection !== null) {
        setSelection(null)
      } else {
        setIsOpen((isOpen: boolean) => !isOpen)
      }
    }, [selection, variant, setIsOpen, setSelection])

    const handleOptionSelect = useCallback((option: FilterButtonOption) => {
      setSelection(option)
    }, [])

    const anchorRef = useRef<HTMLButtonElement>(null)

    return (
      <BaseButton
        ref={ref || anchorRef}
        styles={{
          button: buttonCss,
          icon: iconCss
        }}
        onClick={handleButtonClick}
        iconRight={
          variant === 'fillContainer' && selection !== null
            ? IconCloseAlt
            : iconRight
        }
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        {selection?.label ?? label}
        <Popup
          anchorRef={(ref as RefObject<HTMLElement>) || anchorRef}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          anchorOrigin={popupAnchorOrigin}
          transformOrigin={popupTransformOrigin}
          portalLocation={popupPortalLocation}
          zIndex={popupZIndex}
        >
          <Paper mt='s' border='strong' shadow='far'>
            <Box p='s'>
              <Flex
                direction='column'
                alignItems='flex-start'
                justifyContent='center'
                role='listbox'
                aria-label={selection?.label ?? label ?? props['aria-label']}
                aria-activedescendant={selection?.label}
              >
                {options.map((option) => (
                  <BaseButton
                    key={option.label}
                    iconLeft={option.icon}
                    styles={{
                      button: optionCss,
                      icon: optionIconCss
                    }}
                    onClick={() => handleOptionSelect(option)}
                    aria-label={option.label}
                    role='option'
                  >
                    {option.label}
                  </BaseButton>
                ))}
              </Flex>
            </Box>
          </Paper>
        </Popup>
      </BaseButton>
    )
  }
)
