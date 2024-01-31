import { Story } from '@storybook/react'

import { RadioButtonGroup } from 'components/RadioButtonGroup'

import { RadioButton, RadioButtonProps } from './RadioButton'

export default {
  component: RadioButton,
  title: 'Components/RadioButton'
}

const Template: Story<RadioButtonProps> = (args) => {
  return (
    <RadioButtonGroup name='test-radio-buttons'>
      <label>
        <RadioButton value={1} {...args} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: 0 }}>Option 1 Title</h2>
          <p>Option description</p>
        </div>
      </label>
      <label>
        <RadioButton value={2} {...args} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: 0 }}>Option 2 Title</h2>
          <p>Option description</p>
        </div>
      </label>
      <label>
        <RadioButton disabled value={3} {...args} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: 0 }}>Option 3 Title</h2>
          <p>Option description</p>
        </div>
      </label>
      <RadioButton value={4} {...args} />
    </RadioButtonGroup>
  )
}

// Default
export const Default: any = Template.bind({})
