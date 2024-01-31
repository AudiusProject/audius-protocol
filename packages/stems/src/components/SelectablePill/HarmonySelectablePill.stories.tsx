import { useState } from 'react'

import { Story } from '@storybook/react'

import { IconHeart } from 'components/Icons'

import { HarmonySelectablePill } from './HarmonySelectablePill'
import { HarmonySelectablePillProps } from './types'

export default {
  component: HarmonySelectablePill,
  title: 'Components/HarmonySelectablePill'
}

const Template: Story<HarmonySelectablePillProps> = ({ ...args }) => {
  const [isSelected, setIsSelected] = useState(false)
  return (
    <HarmonySelectablePill
      onClick={() => setIsSelected(!isSelected)}
      {...args}
      isSelected={args.isSelected === undefined ? isSelected : args.isSelected}
    />
  )
}

const baseProps: Partial<HarmonySelectablePillProps> = {
  size: 'default',
  label: 'Label'
}

// Default
export const Primary: any = Template.bind({})
Primary.args = { ...baseProps }

// Large
export const Large: any = Template.bind({})
Large.args = { size: 'large', ...baseProps }

// Icon
export const WithIcon: any = Template.bind({})
WithIcon.args = { ...baseProps, icon: IconHeart }

// Icon - large
export const LargeWithIcon: any = Template.bind({})
LargeWithIcon.args = { ...baseProps, size: 'large', icon: IconHeart }
