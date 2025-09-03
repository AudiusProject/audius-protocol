import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { useAddCashModal } from '@audius/common/store'
import { Flex, IconError, Text, TextLink } from '@audius/harmony'
import { Paper } from '~harmony/components/layout/Paper'

import { make, track } from 'services/analytics'

const messages = {
  topUp: 'Top up your cash balance to continue!',
  linkText: 'Add Cash'
}

export const AddCashBanner = ({ onClick }: { onClick: () => void }) => {
  const { onOpen: openAddCashModal } = useAddCashModal()

  const handleClick = useCallback(() => {
    openAddCashModal()
    onClick()

    track(
      make({
        eventName: Name.BUY_SELL_ADD_FUNDS_CLICKED,
        source: 'insufficient_balance_hint'
      })
    )
  }, [openAddCashModal, onClick])

  return (
    <Paper backgroundColor='surface2' pv='m' ph='l' gap='l'>
      <IconError color='subdued' />
      <Flex gap='xs'>
        <Text>{messages.topUp}</Text>
        <TextLink onClick={handleClick} variant='active'>
          {messages.linkText}
        </TextLink>
      </Flex>
    </Paper>
  )
}
