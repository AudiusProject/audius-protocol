import { expect } from '@storybook/jest'
import type { Meta, StoryObj } from '@storybook/react'
import { within } from '@storybook/testing-library'

import { Box, Flex } from 'components/layout'
import { IconAlbum, IconCampfire, IconFilter, IconRadar } from 'icons'

import { FilterButtonProps, FilterButtonType } from '../types'

import { FilterButton } from './FilterButton'

const meta: Meta<typeof FilterButton> = {
  title: 'Buttons/FilterButton [beta]',
  component: FilterButton,
  args: {
    options: [
      { label: 'Red Rover' },
      { label: 'Green Goblin' },
      { label: 'Blue Man Group' }
    ],
    label: 'Choice',
    popupAnchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    popupTransformOrigin: { horizontal: 'center', vertical: 'top' }
  },
  argTypes: {
    options: {
      control: { type: 'object' }
    },
    label: {
      control: { type: 'text' }
    },
    initialSelectionIndex: {
      control: { type: 'number' }
    }
  }
}

export default meta

type Story = StoryObj<typeof FilterButton>

// Overview Story
export const Primary: Story = {
  render: () => (
    <Box h='200px'>
      <Flex pv='2xl' justifyContent='space-around'>
        <FilterButton
          label='Choice'
          options={[
            { label: 'Red Rover' },
            { label: 'Green Goblin' },
            { label: 'Blue Man Group' }
          ]}
        />
      </Flex>
    </Box>
  )
}

export const FillContainer: Story = {
  render: () => (
    <Box h='200px'>
      <Flex pv='2xl' justifyContent='space-around'>
        <FilterButton
          label='Choice'
          options={[
            { label: 'Red Rover' },
            { label: 'Green Goblin' },
            { label: 'Blue Man Group' }
          ]}
        />
      </Flex>
    </Box>
  )
}

export const ReplaceLabel: Story = {
  render: () => (
    <Box h='200px'>
      <Flex pv='2xl' justifyContent='space-around'>
        <FilterButton
          variant={FilterButtonType.REPLACE_LABEL}
          label='Choice'
          options={[
            { label: 'Red Leader' },
            { label: 'Green Juice' },
            { label: 'Blue Moon' }
          ]}
        />
      </Flex>
    </Box>
  )
}

export const CustomIcon: Story = {
  render: () => (
    <Box h='200px'>
      <Flex pv='2xl' justifyContent='space-around'>
        <FilterButton
          iconRight={IconFilter}
          options={[
            { label: 'Radar Option', icon: IconRadar },
            { label: 'Or A CD?', icon: IconAlbum },
            { label: "Ooh! We're Cookin Now!", icon: IconCampfire }
          ]}
        />
      </Flex>
    </Box>
  )
}

export const Accessibility: Story = {
  render: (props: FilterButtonProps) => (
    <Box h='200px'>
      <Flex pv='2xl' justifyContent='space-around'>
        <FilterButton {...props} />
      </Flex>
    </Box>
  ),
  play: async () => {
    // Note we use body here instead of the canvas because
    // Popup portals outside to document.body. Probably a TODO to fix that
    // portaling.
    const body = within(document.body)
    await body.getByRole('button', { name: /choice/i }).click()
    await expect(body.getByRole('listbox', { name: /choice/i }))
    await expect(body.getByRole('option', { name: /green goblin/i }))
  }
}
