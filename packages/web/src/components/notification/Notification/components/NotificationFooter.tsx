import { Flex, Pill, Text } from '@audius/harmony'

const messages = {
  unread: 'new'
}

type NotificationFooterProps = {
  timeLabel?: string
  isViewed: boolean
}

export const NotificationFooter = (props: NotificationFooterProps) => {
  const { timeLabel, isViewed } = props
  return (
    <Flex alignItems='center' justifyContent='space-between'>
      <Text size='xs' color='subdued'>
        {timeLabel}
      </Text>
      {isViewed ? null : <Pill variant='active'>{messages.unread}</Pill>}
    </Flex>
  )
}
