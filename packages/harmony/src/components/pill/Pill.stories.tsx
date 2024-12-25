import { Meta, StoryObj } from '@storybook/react'

import { IconArrowRight, IconPlus } from '~harmony/icons'

import { Pill } from './Pill'

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill
}

export default meta

type Story = StoryObj<typeof Pill>

export const Primary: Story = {
  render: () => (
    <Pill variant='default' iconLeft={IconPlus} onClick={() => {}}>
      New
    </Pill>
  )
}

export const Active: Story = {
  render: () => <Pill variant='active'>New</Pill>
}

export const Rewards: Story = {
  render: () => (
    <Pill variant='active' iconRight={IconArrowRight} onClick={() => {}}>
      Earn $Audio
    </Pill>
  )
}

export const ClaimRewards: Story = {
  render: () => (
    <Pill
      variant='custom'
      css={(theme) => ({ backgroundColor: theme.color.special.lightGreen })}
      iconRight={IconArrowRight}
      onClick={() => {}}
    >
      Claim Rewards
    </Pill>
  )
}
