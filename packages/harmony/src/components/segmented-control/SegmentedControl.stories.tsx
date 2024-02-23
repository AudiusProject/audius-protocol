import { Meta, StoryObj } from '@storybook/react'

import { SegmentedControl } from './SegmentedControl'
import { Option } from './types'

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

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    options
  }
}

export default meta

type Story = StoryObj<typeof SegmentedControl>

export const Primary: Story = {
  render: (props) => <SegmentedControl {...props} />
}

export const FullWidth: Story = {
  render: (props) => <SegmentedControl {...props} fullWidth />
}

export const EqualWidth: Story = {
  render: (props) => <SegmentedControl {...props} equalWidth />
}

export const IsMobile: Story = {
  render: (props) => <SegmentedControl {...props} isMobile />
}

export const Disabled: Story = {
  render: (props) => <SegmentedControl {...props} disabled />
}

export const OptionDisabled: Story = {
  render: (props) => {
    const optionDisabledProps = {
      ...props,
      options: [
        props.options[0],
        ...props.options
          .slice(1)
          .map((option) => ({ ...option, disabled: true }))
      ]
    }
    return <SegmentedControl {...optionDisabledProps} />
  }
}

export const OptionVariant: Story = {
  render: (props) => {
    const optionVariantProps = {
      ...props,
      options: [
        ...props.options.slice(0, 2),
        ...props.options.slice(2).map((option) => ({
          ...option,
          variant: 'subdued' as 'default' | 'subdued'
        }))
      ]
    }
    return <SegmentedControl {...optionVariantProps} />
  }
}
