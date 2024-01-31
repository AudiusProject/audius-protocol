import { Story } from '@storybook/react'

import { RadioPillButton } from 'components/RadioPillButton'

import { RadioButtonGroup, RadioButtonGroupProps } from '.'

export default {
  component: RadioButtonGroup,
  title: 'Components/RadioButtonGroup'
}

const defaultProps: RadioButtonGroupProps = {
  name: 'Test',
  onChange: (value) => {
    console.info(value)
  }
}

const Template: Story<RadioButtonGroupProps> = (args) => {
  return (
    <RadioButtonGroup {...defaultProps} {...args}>
      {['5', '10', '25', '50', '100'].map((v) => (
        <RadioPillButton label={v} key={v} value={v} />
      ))}
    </RadioButtonGroup>
  )
}

// Default
export const Default: any = Template.bind({})
