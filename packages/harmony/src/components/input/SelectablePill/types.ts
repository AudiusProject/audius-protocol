import type { ComponentPropsWithoutRef } from 'react'

import type { IconComponent } from 'components/typography/Icons'

export type SelectablePillProps = {
  size?: 'default' | 'large'
  isSelected: boolean
  label: string
  icon?: IconComponent
} & Omit<ComponentPropsWithoutRef<'button'>, 'children'>
