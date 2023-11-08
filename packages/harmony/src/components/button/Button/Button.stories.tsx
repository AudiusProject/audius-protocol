import { expect } from '@storybook/jest'
import type { Meta, StoryObj } from '@storybook/react'
import { within } from '@storybook/testing-library'

import { Box, Flex } from 'components/layout'
import { Text } from 'components/text'
import { IconArrowLeft, IconArrowRight } from 'icons'

import { ButtonProps, ButtonSize, ButtonType } from '../types'

import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Buttons/Button',
  component: Button
}

export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {
  render: (props: ButtonProps) => <Button {...props}>Button</Button>
}

export const Variants: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button variant={ButtonType.PRIMARY}>Primary</Button>
      <Button variant={ButtonType.SECONDARY}>Secondary</Button>
      <Button variant={ButtonType.TERTIARY}>Tertiary</Button>
      <Button variant={ButtonType.DESTRUCTIVE}>Destructive</Button>
    </Flex>
  )
}

export const Sizes: Story = {
  render: () => (
    <Flex gap='3xl' alignItems='end'>
      <Flex direction='column' alignItems='center' gap='m'>
        <Button size={ButtonSize.SMALL}>Small</Button>
        <Text>32px</Text>
      </Flex>

      <Flex direction='column' alignItems='center' gap='m'>
        <Button size={ButtonSize.DEFAULT}>Medium</Button>
        <Text>48px</Text>
      </Flex>
      <Flex direction='column' alignItems='center' gap='m'>
        <Button size={ButtonSize.LARGE}>Large</Button>
        <Text>64px</Text>
      </Flex>
    </Flex>
  )
}

export const States: Story = {
  render: () => (
    <Flex
      direction='column'
      gap='2xl'
      justifyContent='center'
      alignItems='flex-start'
    >
      <Flex gap='2xl' alignItems='center'>
        <Text css={{ width: 56 }}>Hover</Text>
        <Button variant={ButtonType.PRIMARY} _isHovered>
          Primary
        </Button>
        <Button variant={ButtonType.SECONDARY} _isHovered>
          Secondary
        </Button>
        <Button variant={ButtonType.TERTIARY} _isHovered>
          Tertiary
        </Button>
        <Button variant={ButtonType.DESTRUCTIVE} _isHovered>
          Destructive
        </Button>
      </Flex>
      <Flex gap='2xl' alignItems='center'>
        <Text css={{ width: 56 }}>Pressed</Text>
        <Button variant={ButtonType.PRIMARY} _isPressed>
          Primary
        </Button>
        <Button variant={ButtonType.SECONDARY} _isPressed>
          Secondary
        </Button>
        <Button variant={ButtonType.TERTIARY} _isPressed>
          Tertiary
        </Button>
        <Button variant={ButtonType.DESTRUCTIVE} _isPressed>
          Destructive
        </Button>
      </Flex>
    </Flex>
  )
}

export const Disabled: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button variant={ButtonType.PRIMARY} disabled>
        Primary
      </Button>
      <Button variant={ButtonType.SECONDARY} disabled>
        Secondary
      </Button>
      <Button variant={ButtonType.TERTIARY} disabled>
        Tertiary
      </Button>
      <Button variant={ButtonType.DESTRUCTIVE} disabled>
        Destructive
      </Button>
    </Flex>
  )
}

export const Icons: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Button iconLeft={IconArrowLeft}>Leading Icon</Button>
      <Button iconRight={IconArrowRight}>Trailing Icon</Button>
    </Flex>
  )
}

export const LoadingState: Story = {
  render: () => (
    <Flex justifyContent='space-between'>
      <Flex direction='column' gap='2xl'>
        <Button color='lightGreen'>Buy $1.99</Button>
        <Button isLoading>Purchasing</Button>
      </Flex>
      <Box alignSelf='flex-end'>
        <Text>Show loading state on click</Text>
      </Box>
    </Flex>
  )
}

export const ColorPropApplied: Story = {
  render: () => (
    <Flex gap='2xl'>
      <Flex direction='column' gap='m' flex={1}>
        <Box>
          <Button color='blue'>Default</Button>
        </Box>
        <Flex as='ul' direction='column' gap='s'>
          <Text asChild>
            <li>Background: Color Value</li>
          </Text>
          <Text asChild>
            <li>Shadow: Near</li>
          </Text>
          <Text asChild>
            <li>Transform Scale: 1x</li>
          </Text>
        </Flex>
      </Flex>

      <Flex direction='column' gap='m' flex={1}>
        <Box>
          <Button color='blue' _isHovered>
            Hover
          </Button>
        </Box>
        <Flex as='ul' direction='column' gap='s'>
          <Text asChild>
            <li>Background: Color Value + White Overlay @ 10% Opacity</li>
          </Text>
          <Text asChild>
            <li>Shadow: Mid</li>
          </Text>
          <Text asChild>
            <li>Transform Scale: 1.04x</li>
          </Text>
        </Flex>
      </Flex>

      <Flex direction='column' gap='m' flex={1}>
        <Box>
          <Button color='blue' _isPressed>
            Pressed
          </Button>
        </Box>
        <Flex as='ul' direction='column' gap='s'>
          <Text asChild>
            <li>Background: Color Value + Black Overlay @ 20% Opacity</li>
          </Text>
          <Text asChild>
            <li>Shadow: None</li>
          </Text>
          <Text asChild>
            <li>Transform Scale: 0.98x</li>
          </Text>
        </Flex>
      </Flex>

      <Flex direction='column' gap='m' flex={1}>
        <Box>
          <Button color='blue' disabled>
            Disabled
          </Button>
        </Box>
        <Flex as='ul' direction='column' gap='s'>
          <Text asChild>
            <li>Background: n-150</li>
          </Text>
          <Text asChild>
            <li>Shadow: None</li>
          </Text>
          <Text asChild>
            <li>Transform Scale: 1x</li>
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const Link: Story = {
  args: { asChild: true },
  render: (props: ButtonProps) => {
    return (
      <Button {...props} asChild>
        <a
          href='/'
          onClick={(e) => {
            e.preventDefault()
          }}
          style={{ textDecorationLine: 'unset' }}
        >
          Click Me
        </a>
      </Button>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('link', { name: /click me/i })
    ).toBeInTheDocument()
  }
}
