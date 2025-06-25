import BN from 'bn.js'

export type ProgressValue = number | BN

export type ProgressBarProps = {
  className?: string
  sliderClassName?: string
  sliderBarClassName?: string
  min?: ProgressValue
  max?: ProgressValue
  value: ProgressValue
  showLabels?: boolean
  minWrapper?: React.ComponentType<{ value: ProgressValue }>
  maxWrapper?: React.ComponentType<{ value: ProgressValue }>
  'aria-labelledby'?: string
}
