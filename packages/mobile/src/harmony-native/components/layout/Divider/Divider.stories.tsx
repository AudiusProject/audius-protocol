import type { Meta, StoryObj } from '@storybook/react-native'

import { Text } from '../../Text/Text'
import { Flex } from '../Flex/Flex'

import { Divider } from './Divider'
import type { DividerProps } from './types'

const meta: Meta<DividerProps> = {
  title: 'Layout/Divider',
  component: Divider
}

export default meta

type Story = StoryObj<DividerProps>

export const Horizontal: Story = {
  render: () => (
    <Flex p='m' gap='m'>
      <Text variant='label'>Label A</Text>
      <Divider />
      <Text variant='label'>Label B</Text>
      <Divider />
      <Text variant='label'>Label C</Text>
    </Flex>
  )
}

export const Vertical: Story = {
  render: () => (
    <Flex p='m' direction='row' gap='m'>
      <Text variant='label'>Label A</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label B</Text>
      <Divider orientation='vertical' />
      <Text variant='label'>Label C</Text>
    </Flex>
  )
}

export const WithText: Story = {
  render: () => (
    <Flex p='m' gap='xl'>
      <Flex gap='m'>
        <Text variant='heading' size='s'>
          Horizontal
        </Text>
        <Flex
          border='strong'
          borderRadius='m'
          justifyContent='center'
          mb='m'
          pv='m'
          gap='s'
        >
          <Flex direction='row' justifyContent='space-evenly' pv='s'>
            <Text variant='label'>Label 1</Text>
            <Text variant='label'>Label 2</Text>
            <Text variant='label'>Label 3</Text>
          </Flex>
          <Divider>
            <Text color='subdued'>Text</Text>
          </Divider>
          <Flex direction='row' justifyContent='space-evenly' pv='s'>
            <Text variant='label'>Label 4</Text>
            <Text variant='label'>Label 5</Text>
            <Text variant='label'>Label 6</Text>
          </Flex>
          <Divider>
            <Text color='subdued'>Text</Text>
          </Divider>
          <Flex direction='row' justifyContent='space-evenly' pv='s'>
            <Text variant='label'>Label 7</Text>
            <Text variant='label'>Label 8</Text>
            <Text variant='label'>Label 9</Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex gap='m'>
        <Text variant='heading' size='s'>
          Vertical
        </Text>
        <Flex
          direction='row'
          border='strong'
          borderRadius='m'
          justifyContent='center'
          gap='l'
        >
          <Flex pv='s' gap='l'>
            <Text variant='label'>Label 1</Text>
            <Text variant='label'>Label 2</Text>
            <Text variant='label'>Label 3</Text>
          </Flex>
          <Divider orientation='vertical'>
            <Text color='subdued'>Text</Text>
          </Divider>
          <Flex pv='s' gap='l'>
            <Text variant='label'>Label 4</Text>
            <Text variant='label'>Label 5</Text>
            <Text variant='label'>Label 6</Text>
          </Flex>
          <Divider orientation='vertical'>
            <Text color='subdued'>Text</Text>
          </Divider>
          <Flex pv='s' gap='l'>
            <Text variant='label'>Label 7</Text>
            <Text variant='label'>Label 8</Text>
            <Text variant='label'>Label 9</Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
