import type { Meta, StoryObj } from '@storybook/react'

import { Flex, Text } from 'components'
import { IconHeart } from 'icons'

import { SelectablePill } from './SelectablePill'

const meta: Meta<typeof SelectablePill> = {
  title: 'Inputs/SelectablePill',
  component: SelectablePill,
  args: {
    label: 'Label'
  }
}

export default meta

type Story = StoryObj<typeof SelectablePill>

export const Primary: Story = {
  render: (props) => (
    <Flex gap='4xl' alignItems='center'>
      <SelectablePill {...props} size='default' />
      <SelectablePill {...props} size='large' />
    </Flex>
  )
}

export const Size: Story = {
  render: (props) => (
    <Flex direction='column' gap='2xl'>
      <Flex gap='4xl' alignItems='center'>
        <Text>Small</Text>
        <SelectablePill {...props} size='default' />
      </Flex>
      <Flex gap='4xl' alignItems='center'>
        <Text>Large</Text>
        <SelectablePill {...props} size='large' />
      </Flex>
    </Flex>
  )
}

export const States: Story = {
  render: () => (
    <Flex gap='4xl' alignItems='center'>
      <SelectablePill label='Default' />
      <SelectablePill label='Hover' _isHovered />
      <SelectablePill label='Active' isSelected />
      <SelectablePill label='Disabled' isSelected={false} disabled />
      <SelectablePill label='Active Disabled' isSelected disabled />
    </Flex>
  )
}

export const PillAsMenu: Story = {
  render: () => <Text>TODO</Text>
}

export const LeadingIcon: Story = {
  render: (props) => <SelectablePill icon={IconHeart} {...props} />
}
