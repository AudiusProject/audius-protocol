import type { Meta, StoryObj } from '@storybook/react'

import { Text } from '../../text/Text'
import { Flex } from '../Flex'

import { Divider } from './Divider'

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  render: () => (
    <Flex border='strong' borderRadius='m' p='l' gap='m'>
      <Text variant='label'>Label A</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label B</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label C</Text>
      <Divider orientation='vertical' />
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
      p='l'
      justifyContent='center'
      gap='m'
    >
      <Text variant='label'>Label A</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label B</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label C</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label D</Text>
    </Flex>
  )
}

export const Horizontal: Story = {
  render: () => (
    <Flex border='strong' borderRadius='m' p='l' direction='column' gap='m'>
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

export const WithText: Story = {
  render: () => (
    <Divider>
      <Text color='subdued'>Text</Text>
    </Divider>
  )
}
