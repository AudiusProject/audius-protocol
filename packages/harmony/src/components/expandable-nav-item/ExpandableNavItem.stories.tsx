import type { Meta, StoryObj } from '@storybook/react'

import { IconFolder, IconKebabHorizontal, IconPlaylists } from '../../icons'

import { ExpandableNavItem } from './ExpandableNavItem'

const meta: Meta<typeof ExpandableNavItem> = {
  title: 'Navigation/ExpandableNavItem',
  component: ExpandableNavItem,
  parameters: {
    layout: 'centered'
  }
}

export default meta

type Story = StoryObj<typeof ExpandableNavItem>

export const Default: Story = {
  args: {
    children: 'Folder Name',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />
  }
}

export const WithIcons: Story = {
  args: {
    children: 'Folder Name',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />
  }
}

export const NestedFolders: Story = {
  args: {
    children: 'Parent Folder',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />,
    defaultIsOpen: true,
    nestedItems: (
      <>
        <ExpandableNavItem leftIcon={IconPlaylists}>
          Nested Item 1
        </ExpandableNavItem>
        <ExpandableNavItem leftIcon={IconPlaylists}>
          Nested Item 2
        </ExpandableNavItem>
      </>
    )
  }
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Folder',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />,
    css: { opacity: 0.5, pointerEvents: 'none' }
  }
}
