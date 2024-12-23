import type { Meta, StoryObj } from '@storybook/react'

import { IconFeed, IconVolumeLevel3 } from '../../icons'

import { NavItem } from './NavItem'

const meta: Meta<typeof NavItem> = {
  title: 'Navigation/NavItem',
  component: NavItem,
  parameters: {
    design: {
      type: 'figma',
      url: '' // Add your Figma URL here
    }
  },
  tags: ['autodocs']
}

export default meta

type Story = StoryObj<typeof NavItem>

export const Default: Story = {
  args: {
    children: 'Label'
  }
}

export const Selected: Story = {
  args: {
    children: 'Label',
    isSelected: true
  }
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Label',
    leftIcon: IconFeed
  }
}

export const WithRightIcon: Story = {
  args: {
    children: 'Label',
    rightIcon: IconVolumeLevel3
  }
}

export const WithBothIcons: Story = {
  args: {
    children: 'Label',
    leftIcon: IconFeed,
    rightIcon: IconVolumeLevel3
  }
}
