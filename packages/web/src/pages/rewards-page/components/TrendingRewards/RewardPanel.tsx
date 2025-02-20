import {
  ChallengeRewardID,
  OptimisticUserChallenge
} from '@audius/common/models'
import { Paper, Text, useTheme } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

export type RewardPanelProps = {
  title: string
  description: (amount?: OptimisticUserChallenge) => string
  onClickButton: () => void
  id: ChallengeRewardID
}

const PANEL_WIDTH = 320

export const RewardPanel = ({
  title,
  description,
  onClickButton
}: RewardPanelProps) => {
  const { spacing } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Paper
      onClick={onClickButton}
      pv='unit10'
      w='100%'
      ph={isMobile ? 'l' : 'xl'}
      flex={`1 1 calc(50% - ${spacing.unit4}px)`}
      direction='column'
      shadow='flat'
      border='strong'
      alignItems='flex-start'
      css={{ minWidth: PANEL_WIDTH }}
    >
      <Text variant='heading'>{title}</Text>
      <Text variant='body' size='l' strength='default' textAlign='left'>
        {description()}
      </Text>
    </Paper>
  )
}
