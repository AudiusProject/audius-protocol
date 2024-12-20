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
    label: 'Folder Name',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />
  }
}

export const WithIcons: Story = {
  args: {
    label: 'Folder Name',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />
  }
}

export const NestedFolders: Story = {
  args: {
    label: 'Parent Folder',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />,
    defaultIsOpen: true,
    nestedItems: (
      <>
        <ExpandableNavItem label='Nested Item 1' leftIcon={IconPlaylists} />
        <ExpandableNavItem label='Nested Item 2' leftIcon={IconPlaylists} />
      </>
    )
  }
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Folder',
    leftIcon: IconFolder,
    rightIcon: <IconKebabHorizontal color='subdued' />,
    css: { opacity: 0.5, pointerEvents: 'none' }
  }
}
