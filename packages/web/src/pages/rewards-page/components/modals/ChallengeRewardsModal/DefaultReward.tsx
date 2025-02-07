import { ProgressReward } from './ProgressReward'

type DefaultRewardProps = {
  amount?: number
  subtext?: string
}

export const DefaultReward = ({ amount, subtext }: DefaultRewardProps) => {
  return <ProgressReward amount={amount} subtext={subtext} />
}
