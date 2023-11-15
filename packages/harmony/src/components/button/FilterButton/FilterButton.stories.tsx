import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'
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
    }
  }
}

export default meta

type Story = StoryObj<typeof FilterButton>

// Overview Story
export const Primary: Story = {
  render: (props: FilterButtonProps) => (
    <Flex pv='2xl' justifyContent='space-around'>
      <FilterButton {...props} />
    </Flex>
  )
}

export const FillContainer: Story = {
  render: () => (
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
  )
}

export const ReplaceLabel: Story = {
  render: () => (
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
  )
}

// Default
export const CustomIcon: Story = {
  render: () => (
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
  )
}
