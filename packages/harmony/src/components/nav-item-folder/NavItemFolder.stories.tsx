import type { Meta, StoryObj } from '@storybook/react'

import { IconFolder, IconKebabHorizontal, IconPlaylists } from '../../icons'

import { NavItemFolder } from './NavItemFolder'

const meta: Meta<typeof NavItemFolder> = {
  title: 'Navigation/NavItemFolder',
  component: NavItemFolder,
  parameters: {
    layout: 'centered'
  }
}

export default meta

type Story = StoryObj<typeof NavItemFolder>

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
        <NavItemFolder leftIcon={IconPlaylists}>Nested Item 1</NavItemFolder>
        <NavItemFolder leftIcon={IconPlaylists}>Nested Item 2</NavItemFolder>
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
