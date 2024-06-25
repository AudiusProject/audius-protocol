import { forwardRef, useRef, useState, useCallback, useEffect } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { BaseButton } from 'components/button/BaseButton/BaseButton'
import { useControlled } from 'hooks/useControlled'
import { IconCloseAlt } from 'icons'

import { FilterButtonProps } from './types'

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  function FilterButton(props, ref) {
    const {
      value: valueProp,
      children,
      label: labelProp,
      onChange,
      onClick,
      onOpen,
      onReset,
      disabled,
      variant = 'fillContainer',
      size = 'default',
      iconRight
    } = props
    const { color, cornerRadius, spacing, typography } = useTheme()
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
      variant !== 'fillContainer' || value === null
        ? {
            border: `1px solid ${color.border.strong}`,
            background: color.background.surface2
          }
        : {}

    const hoverStyle = {
      border: `1px solid ${color.neutral.n800}`,
      transform: 'none'
    }

    // Button Styles
    const buttonCss: CSSObject = {
      background: color.background.white,
      border: `1px solid ${color.border.strong}`,
      borderRadius: cornerRadius.s,
      color:
        variant === 'fillContainer' && value !== null
          ? color.static.white
          : color.text.default,
      gap: spacing.xs,
      fontSize: typography.size.s,
      fontWeight: typography.weight.demiBold,
      lineHeight: typography.lineHeight.s,
      opacity: disabled ? 0.6 : 1,

      '&:hover': hoverStyle,
      '&:focus': hoverStyle,

      '&:active': {
        ...activeStyle,
        transform: 'none'
      },

      ...(size === 'small' ? smallStyles : defaultStyles),
      ...(isOpen ? activeStyle : {}),
      ...(variant === 'fillContainer' && value !== null
        ? fillContainerStyles
        : {})
    }

    const iconCss = size === 'small' ? smallIconStyles : defaultIconStyles

    const handleButtonClick = useCallback(() => {
      if (onClick) {
        onClick()
      } else {
        if (variant === 'fillContainer' && value !== null) {
          setValue(null)
          setLabel(null)
          // @ts-ignore
          onChange?.(null)
          onReset?.()
        } else {
          setIsOpen((isOpen: boolean) => !isOpen)
        }
      }
    }, [
      value,
      variant,
      setIsOpen,
      setValue,
      setLabel,
      onChange,
      onClick,
      onReset
    ])

    useEffect(() => {
      if (isOpen) {
        onOpen?.()
      }
    }, [isOpen, onOpen])

    const handleChange = useCallback(
      (value: string, label: string) => {
        setValue(value)
        setLabel(label)
        onChange?.(value)
      },
      [onChange, setValue, setLabel]
    )

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
          variant === 'fillContainer' && value !== null
            ? IconCloseAlt
            : iconRight
        }
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        {label}
        {children?.({
          isOpen,
          setIsOpen,
          handleChange,
          anchorRef
        })}
      </BaseButton>
    )
  }
)
