import type { Meta, StoryObj } from '@storybook/react-native'

import { IconHeart } from '@audius/harmony-native'

import { Flex } from '../../layout/Flex/Flex'

import { SelectablePill } from './SelectablePill'
import type { SelectablePillProps } from './types'

const meta: Meta<SelectablePillProps> = {
  title: 'Components/Input/SelectablePill',
  component: SelectablePill,
  argTypes: {
    label: {
      description: 'Label',
      control: { type: 'text' }
    },
    size: {
      description: 'Size',
      control: { type: 'radio' },
      options: ['small', 'large']
    },
    isSelected: {
      description: 'Selected',
      control: {
        type: 'boolean'
      }
    },
    disabled: {
      description: 'Disabled',
      control: {
        type: 'boolean'
      }
    }
  },
  args: {
    label: 'Option',
    icon: IconHeart
  },
  render: (props) => (
    <Flex p='l'>
      <SelectablePill {...props} />
    </Flex>
  )
}

export default meta

type Story = StoryObj<SelectablePillProps>

export const Default: Story = {}

export const Large: Story = {
  args: {
    size: 'large'
  }
}

export const Selected: Story = {
  args: {
    isSelected: true
  }
}
