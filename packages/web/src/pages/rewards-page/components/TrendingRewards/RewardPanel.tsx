import {
  ChallengeRewardID,
  OptimisticUserChallenge
} from '@audius/common/models'
import { Box, Flex, Paper, Text, useTheme } from '@audius/harmony'

export type RewardPanelProps = {
  title: string
  description: (amount?: OptimisticUserChallenge) => string
  onClickButton: () => void
  id: ChallengeRewardID
}

export const RewardPanel = ({
  title,
  description,
  onClickButton
}: RewardPanelProps) => {
  const { spacing } = useTheme()

  return (
    <Paper
      onClick={onClickButton}
      ph='s'
      h={144}
      flex={`0 0 calc(50% - ${spacing.unit4}px)`}
      direction='column'
      m='s'
      shadow='flat'
      border='strong'
      css={{
        minWidth: '336px'
      }}
    >
      <Flex direction='column' justifyContent='center' h='100%' gap='xl'>
        <Flex
          direction='column'
          alignItems='flex-start'
          justifyContent='space-between'
          w='100%'
          gap='s'
          pl='l'
        >
          <Box>
            <Text variant='heading'>{title}</Text>
          </Box>
          <Box css={{ textAlign: 'left' }}>
            <Text variant='body' size='l' strength='default'>
              {description()}
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Paper>
  )
}
