import { Story } from '@storybook/react'

import { SegmentedControl } from './SegmentedControl'
import { SegmentedControlProps, Option } from './types'

export default {
  component: SegmentedControl,
  title: 'Components/SegmentedControl',
  argTypes: {}
}

const Template: Story<SegmentedControlProps> = args => (
  <SegmentedControl {...args} />
)

const options: Option[] = [
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

// Primary
export const Primary = Template.bind({})
const primaryProps: SegmentedControlProps = {
  options,
  selected: selectedOption,
  onSelectOption: handleOptionSelect
}

Primary.args = primaryProps
