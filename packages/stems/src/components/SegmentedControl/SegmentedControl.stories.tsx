import { Story } from '@storybook/react'

import { SegmentedControl } from './SegmentedControl'
import { SegmentedControlProps, Option } from './types'

export default {
  component: SegmentedControl,
  title: 'Components/SegmentedControl',
  argTypes: {}
}

const Template: Story<SegmentedControlProps<string>> = (args) => (
  <SegmentedControl {...args} />
)

const options: Option<string>[] = [
  {
    key: 'a',
    text: 'Long Option A'
  },
  {
    key: 'b',
    text: 'Option B'
  },
  {
    key: 'c',
    text: 'Really Long Option C'
  },
  {
    key: 'd',
    text: 'Option D'
  }
]

let selectedOption = ''

const handleOptionSelect = (key: string) => (selectedOption = key)

const baseProps: SegmentedControlProps<string> = {
  options,
  selected: selectedOption,
  onSelectOption: handleOptionSelect
}

// Primary
export const Primary: any = Template.bind({})
Primary.args = { ...baseProps }

// Full Width
export const FullWidth: any = Template.bind({})
FullWidth.args = { ...baseProps, fullWidth: true }

// Mobile
export const Mobile: any = Template.bind({})
Mobile.args = { ...baseProps, isMobile: true }
