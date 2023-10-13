import type { Meta, StoryObj } from '@storybook/react'

import { Text } from '../../typography/Text'
import { Flex } from '../Flex'

import { Divider } from './Divider'

const meta: Meta<typeof Divider> = {
  title: 'Components/Layout/Divider',
  component: Divider,
  render: () => (
    <Flex border='strong' borderRadius='m' p='m' gap='m'>
      <Text variant='label'>Label A</Text>
      <Divider />
      <Text variant='label'>Label B</Text>
      <Divider />
      <Text variant='label'>Label C</Text>
      <Divider />
      <Text variant='label'>Label D</Text>
    </Flex>
  )
}

export default meta

type Story = StoryObj<typeof Divider>

export const Default: Story = {}

export const Vertical: Story = {
  render: () => (
    <Flex
      border='strong'
      borderRadius='m'
      p='m'
      justifyContent='center'
      gap='m'
    >
      <Text variant='label'>Label A</Text>
      <Divider />
      <Text variant='label'>Label B</Text>
      <Divider />
      <Text variant='label'>Label C</Text>
      <Divider />
      <Text variant='label'>Label D</Text>
    </Flex>
  )
}

export const Horizontal: Story = {
  render: () => (
    <Flex border='strong' borderRadius='m' p='m' direction='column' gap='m'>
      <Text variant='label'>Label A</Text>
      <Divider />
      <Text variant='label'>Label B</Text>
      <Divider />
      <Text variant='label'>Label C</Text>
      <Divider />
      <Text variant='label'>Label D</Text>
    </Flex>
  )
}
