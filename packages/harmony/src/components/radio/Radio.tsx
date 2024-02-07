import { ComponentPropsWithoutRef } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { useRadioGroup } from '../radio-group/useRadioGroup'

export type RadioProps = ComponentPropsWithoutRef<'input'> & {
  inputClassName?: string
}

/**
 * Radio buttons allow a user to select a single option from a list of predefined options.
 * TODO: Add label + icon support
 */
export const Radio = (props: RadioProps) => {
  const {
    className,
    inputClassName,
    onChange,
    name: nameProp,
    checked: checkedProp,
    disabled,
    ...other
  } = props
  const { spacing, color } = useTheme()

  const { name, checked, handleChange } = useRadioGroup({
    name: nameProp,
    checked: checkedProp,
    value: other.value,
    onChange
  })

  const rootCss: CSSObject = {
    position: 'relative',
    height: spacing.unit6,
    width: spacing.unit6,
    '::before': {
      position: 'absolute',
      width: spacing.unit6,
      height: spacing.unit6,
      borderRadius: '50%',
      content: "' '",
      background: color.neutral.n200,
      boxShadow: 'inset 2px 2px 2px rgba(0, 0, 0, 0.1)',
      boxSizing: 'border-box',
      ...(checked && {
        background: color.special.white,
        border: `6px solid ${color.secondary.secondary}`
      }),
      ...(disabled && {
        background: color.neutral.n150
      })
    }
  }

  const inputCss = {
    opacity: 0,
    margin: 0,
    width: '100%',
    height: '100%',
    cursor: disabled ? 'default' : 'pointer'
  }

  return (
    <div css={rootCss} className={className}>
      <input
        css={inputCss}
        className={inputClassName}
        name={name}
        checked={checked}
        type='radio'
        onChange={handleChange}
        disabled={disabled}
        {...other}
      />
    </div>
  )
}
