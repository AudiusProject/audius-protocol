import { Story } from '@storybook/react'

import { PillButton, PillButtonProps } from './'

export default {
  component: PillButton,
  title: 'Components/PillButton'
}

const defaultProps: PillButtonProps = {
  text: 'Pill Button'
}

const Template: Story<PillButtonProps> = (args) => {
  return <PillButton {...defaultProps} {...args} />
}

// Default
export const Default: any = Template.bind({})

// Disabled
export const Disabled: any = Template.bind({})
Disabled.args = { disabled: true }
