import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import type { IconComponent } from '../../typography'

export enum TextInputSize {
  SMALL = 'small',
  DEFAULT = 'default'
}

export type TextInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  // Omitting required purely for storybook docs
  'size' | 'required'
> & {
  /**
   * Input sizes. NOTE: small inputs will not show the label
   * @default default
   */
  size?: TextInputSize
  /**
   * Toggles warning state (turns border warning color). NOTE: this is not used any where at the moment
   */
  warning?: boolean
  /**
   * Toggles error state
   */
  error?: boolean
  /**
   * Hides the label. If the label is hidden the placeholder will show by default instead.
   * @default false
   */
  hideLabel?: boolean
  /**
   * Label Text. Required to provide due to accessibility. If the hideLabel is true, the label used via aria-label
   */
  label: string
  /**
   * ClassName on the div wrapping the whole input container (doesn't include assistive text)
   */
  inputRootClassName?: string
  /**
   * Helper text (or JSX) that shows up below the input
   */
  helperText?: string | ReactNode
  /**
   * Floating text on the lefthand side of the input.
   */
  startAdornmentText?: string
  /**
   * Floating text on the righthand side of the input
   */
  endAdornmentText?: string
  /**
   * Floating icon on the lefthand side of the input. Note: will float to the left of the label & content
   */
  startIcon?: IconComponent
  /**
   * Floating text on the righthand side of the input
   */
  endIcon?: IconComponent
  /**
   * Required or not. Will add an * to the label if required
   */
  required?: boolean
  /**
   * 0-1 number representating a percentage threshold to show the max character text. Default is 0.7 (70%)
   * @default 0.7
   */
  showMaxLengthThreshold?: number
  /**
   * 0-1 number representating a percentage threshold to turn the character limit text orange. Default is 0.9 (90%)
   * @default 0.9
   */
  maxLengthWarningThreshold?: number
}
