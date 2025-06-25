import { ReactNode } from 'react'

import { BNWei } from '@audius/common/models'
import { AUDIO, type AudioWei } from '@audius/fixed-decimal'

import Tooltip from 'components/tooltip/Tooltip'

type TokenHoverTooltipProps = {
  children: ReactNode
  balance: BNWei | AudioWei
  parentMount?: boolean
}

const TokenHoverTooltip = ({
  balance,
  children,
  parentMount = false
}: TokenHoverTooltipProps) => {
  return (
    <Tooltip
      text={`${AUDIO(balance).toLocaleString()} $AUDIO`}
      disabled={AUDIO(balance).value === BigInt(0)}
      placement='top'
      mouseEnterDelay={0.2}
      mount={parentMount ? 'parent' : undefined}
    >
      {children}
    </Tooltip>
  )
}

export default TokenHoverTooltip
