import type { ComponentPropsWithoutRef } from 'react'

import type { IconComponent } from 'components/icon/Icon'

export type SelectablePillProps = {
  size?: 'default' | 'large'
  isSelected: boolean
  label: string
  disabled?: boolean
  icon?: IconComponent
} & Omit<ComponentPropsWithoutRef<'button'>, 'children'>
