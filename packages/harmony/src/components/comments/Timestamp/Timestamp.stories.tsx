import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'

import { Timestamp } from './Timestamp'
import {
  DAY_IN_MONTH,
  HR_IN_DAY,
  MIN_IN_HR,
  MONTH_IN_YEAR,
  MS_IN_S,
  S_IN_MIN
} from './types'

const meta: Meta<typeof Timestamp> = {
  title: 'Components/Comments/Timestamp [beta]',
  component: Timestamp
}

export default meta

type Story = StoryObj<typeof Timestamp>

const secondsAgo = MS_IN_S
const minutesAgo = secondsAgo * S_IN_MIN
const hoursAgo = minutesAgo * MIN_IN_HR
const daysAgo = hoursAgo * HR_IN_DAY
const monthsAgo = daysAgo * DAY_IN_MONTH
const yearsAgo = monthsAgo * MONTH_IN_YEAR

export const Default: Story = {
  render: () => (
    <Flex direction='column' gap='l' p='s'>
      <Timestamp time={new Date(Date.now() - 5 * secondsAgo)} />
      <Timestamp time={new Date(Date.now() - 49 * minutesAgo)} />
      <Timestamp time={new Date(Date.now() - 1 * hoursAgo)} />
      <Timestamp time={new Date(Date.now() - 1 * daysAgo)} />
      <Timestamp time={new Date(Date.now() - 4 * monthsAgo)} />
      <Timestamp time={new Date(Date.now() - 3 * yearsAgo)} />
    </Flex>
  )
}
