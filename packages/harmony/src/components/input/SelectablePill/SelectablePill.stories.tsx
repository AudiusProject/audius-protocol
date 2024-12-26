import type { Meta, StoryObj } from '@storybook/react'

import { Flex, Text } from '~harmony/components'
import { IconHeart } from '~harmony/icons'

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
      <SelectablePill {...props} size='small' />
      <SelectablePill {...props} size='large' />
    </Flex>
  )
}

export const Size: Story = {
  render: (props) => (
    <Flex direction='column' gap='2xl'>
      <Flex gap='4xl' alignItems='center'>
        <Text>Small</Text>
        <SelectablePill {...props} size='small' />
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
    <Flex direction='column' gap='2xl'>
      <Flex gap='4xl' alignItems='center'>
        <SelectablePill label='Default' />
        <SelectablePill label='Hover' _isHovered />
        <SelectablePill label='Active' isSelected />
        <SelectablePill label='Disabled' isSelected={false} disabled />
        <SelectablePill label='Active Disabled' isSelected disabled />
      </Flex>

      <Flex gap='4xl' alignItems='center'>
        <SelectablePill size='large' label='Default' />
        <SelectablePill size='large' label='Hover' _isHovered />
        <SelectablePill size='large' label='Active' isSelected />
        <SelectablePill
          size='large'
          label='Disabled'
          isSelected={false}
          disabled
        />
        <SelectablePill
          size='large'
          label='Active Disabled'
          isSelected
          disabled
        />
      </Flex>
    </Flex>
  )
}

export const PillAsMenu: Story = {
  render: () => <Text>TODO</Text>
}

export const LeadingIcon: Story = {
  render: (props) => <SelectablePill size='large' icon={IconHeart} {...props} />
}

export const PillAsInput: Story = {
  render: () => (
    <Flex direction='column' gap='2xl'>
      <Flex gap='4xl' alignItems='center'>
        <Text css={{ width: 50 }}>Radio</Text>
        <SelectablePill type='radio' label='Radio' />
      </Flex>
      <Flex gap='4xl' alignItems='center'>
        <Text css={{ width: 50 }}>Checkbox</Text>
        <SelectablePill type='checkbox' label='Checkbox' />
      </Flex>
    </Flex>
  )
}
