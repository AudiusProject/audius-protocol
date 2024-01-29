import type { Meta, StoryObj } from '@storybook/react'

import { Box, Flex } from 'components/layout'
import { IconCaretDown, IconNote, IconUserFollowing } from 'icons'

import { PlainButton } from './PlainButton'

const meta: Meta<typeof PlainButton> = {
  title: 'Buttons/PlainButton [beta]',
  component: PlainButton
}

export default meta

type Story = StoryObj<typeof PlainButton>

// Overview Story
export const Primary: Story = {
  render: () => (
    <Flex
      pv='2xl'
      justifyContent='space-around'
      borderRadius='s'
      css={({ color }) => ({ backgroundColor: color.background.default })}
    >
      <PlainButton iconLeft={IconNote}>Button</PlainButton>
      <PlainButton variant='subdued' iconLeft={IconNote}>
        Button
      </PlainButton>
      <PlainButton variant='inverted' iconLeft={IconNote}>
        Button
      </PlainButton>
    </Flex>
  )
}

// Default
export const Default: Story = {
  render: () => <PlainButton iconLeft={IconNote}>Button</PlainButton>
}

// Subdued
export const Subdued: Story = {
  render: () => (
    <PlainButton variant='subdued' iconLeft={IconNote}>
      Button
    </PlainButton>
  )
}

// Inverted
export const Inverted = {
  render: () => (
    <Box pv='l' css={{ backgroundColor: '#888' }}>
      <PlainButton variant='inverted' iconLeft={IconNote}>
        Button
      </PlainButton>
    </Box>
  )
}

// Config stories
export const Sizes: Story = {
  render: () => (
    <Flex pv='2xl' alignItems='center' gap='xl'>
      <PlainButton size='large' iconLeft={IconNote}>
        Button
      </PlainButton>
      <PlainButton iconLeft={IconNote}>Button</PlainButton>
    </Flex>
  )
}

export const LeadingIcons: Story = {
  render: () => (
    <Flex pv='2xl' alignItems='center' gap='xl'>
      <PlainButton iconLeft={IconUserFollowing}>Mutuals</PlainButton>
      <PlainButton variant='subdued' iconLeft={IconUserFollowing}>
        Mutuals
      </PlainButton>
    </Flex>
  )
}

export const TrailingIcons: Story = {
  render: () => (
    <Flex pv='2xl' alignItems='center' gap='xl'>
      <PlainButton size='large' iconRight={IconCaretDown}>
        See More
      </PlainButton>
      <PlainButton iconRight={IconCaretDown}>See More</PlainButton>
    </Flex>
  )
}
