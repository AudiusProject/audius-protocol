import { expect } from '@storybook/jest'
import type { Meta, StoryObj } from '@storybook/react'
import { within } from '@storybook/testing-library'

import { Box, Flex } from '~harmony/components/layout'
import { IconAlbum, IconCampfire, IconFilter, IconRadar } from '~harmony/icons'

import { FilterButton } from './FilterButton'
import { FilterButtonProps } from './types'

const meta: Meta<typeof FilterButton> = {
  title: 'Buttons/FilterButton',
  component: FilterButton,
  args: {
    options: [
      { value: 'Red Rover' },
      { value: 'Green Goblin' },
      { value: 'Blue Man Group' }
    ],
    label: 'Choice',
    menuProps: {
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      transformOrigin: { horizontal: 'center', vertical: 'top' }
    }
  },
  argTypes: {
    options: {
      control: { type: 'object' }
    },
    label: {
      control: { type: 'text' }
    },
    value: {
      control: { type: 'text' }
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
            { value: 'Red Rover' },
            { value: 'Green Goblin' },
            { value: 'Blue Man Group' }
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
            { value: 'Red Rover' },
            { value: 'Green Goblin' },
            { value: 'Blue Man Group' }
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
          variant='replaceLabel'
          label='Choice'
          options={[
            { value: 'Red Leader' },
            { value: 'Green Juice' },
            { value: 'Blue Moon' }
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
            { value: 'Radar Option', icon: IconRadar },
            { value: 'Or A CD?', icon: IconAlbum },
            { value: "Ooh! We're Cookin Now!", icon: IconCampfire }
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
    body.getByRole('button', { name: /choice/i }).click()
    expect(
      await body.findByRole('listbox', { name: /choice/i })
    ).toBeInTheDocument()
    expect(
      await body.findByRole('option', { name: /green goblin/i })
    ).toBeInTheDocument()
  }
}

export const Virtualized: Story = {
  render: (props) => (
    <Box h='200px'>
      <Flex pv='2xl' justifyContent='space-around'>
        <FilterButton
          {...props}
          virtualized
          menuProps={{ maxHeight: 400, width: 200 }}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((index) =>
            (props.options ?? []).map((option) => ({
              value: `${option.value} ${index}` as string
            }))
          )}
        />
      </Flex>
    </Box>
  )
}
