import { Story } from '@storybook/react'

import { RadioPillButton, RadioPillButtonProps } from '.'

export default {
  component: RadioPillButton,
  title: 'Components/RadioPillButton'
}

const defaultProps: RadioPillButtonProps = {
  label: '5',
  value: '5',
  'aria-label': '5 audio'
}

const Template: Story<RadioPillButtonProps> = (args) => {
  return <RadioPillButton {...defaultProps} {...args} />
}

// Default
export const Default: any = Template.bind({})
