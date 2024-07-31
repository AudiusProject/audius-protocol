import {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo
} from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { BaseButton } from 'components/button/BaseButton/BaseButton'
import { IconComponent, IconProps } from 'components/icon'
import { useControlled } from 'hooks/useControlled'
import { IconCloseAlt } from 'icons'

import { FilterButtonProps } from './types'

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  function FilterButton(props, ref) {
    const {
      value: valueProp,
      children,
      label,
      onChange,
      onClick,
      onOpen,
      onReset,
      disabled,
      variant = 'fillContainer',
      size = 'default',
      iconRight,
      leadingElement
    } = props
    const { color, cornerRadius, spacing, typography } = useTheme()
    const [value, setValue] = useControlled({
      controlledProp: valueProp,
      defaultValue: null,
      stateName: 'value',
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
        border: `1px solid ${color.secondary.s400}`
      }
    }

    const hoverStyle = {
      background: color.background.surface1
    }

    const activeStyle = {
      background: color.background.surface2
    }
    const disabledTransform = {
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

      '&:hover': {
        ...disabledTransform,
        ...(value === null && !isOpen ? hoverStyle : {})
      },
      '&:focus': {
        ...disabledTransform,
        ...(value === null ? activeStyle : {})
      },
      '&:active': {
        ...disabledTransform,
        ...(value === null ? activeStyle : {})
      },
      ...(isOpen ? activeStyle : {}),

      ...(size === 'small' ? smallStyles : defaultStyles),
      ...(variant === 'fillContainer' && value !== null
        ? fillContainerStyles
        : {})
    }

    const iconCss = size === 'small' ? smallIconStyles : defaultIconStyles

    const handleClick = useCallback(() => {
      if (onClick) {
        onClick()
      } else {
        setIsOpen((isOpen: boolean) => !isOpen)
      }
    }, [setIsOpen, onClick])

    const Icon = useMemo(() => {
      return variant === 'fillContainer' && value !== null
        ? (((props: IconProps) => (
            <IconCloseAlt
              aria-label='cancel'
              onClick={(e) => {
                e.stopPropagation()
                if (onClick) {
                  onClick()
                } else {
                  // @ts-ignore
                  onChange?.(null)
                  onReset?.()
                }
              }}
              {...props}
            />
          )) as IconComponent)
        : iconRight ?? undefined
    }, [variant, value, iconRight, onClick, onChange, onReset])

    useEffect(() => {
      if (isOpen) {
        onOpen?.()
      }
    }, [isOpen, onOpen])

    const handleChange = useCallback(
      (value: string) => {
        setValue(value)
        onChange?.(value)
      },
      [onChange, setValue]
    )

    const anchorRef = useRef<HTMLButtonElement>(null)

    return (
      <BaseButton
        ref={ref || anchorRef}
        styles={{
          button: buttonCss,
          icon: iconCss
        }}
        onClick={handleClick}
        iconRight={Icon}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        {leadingElement}
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
