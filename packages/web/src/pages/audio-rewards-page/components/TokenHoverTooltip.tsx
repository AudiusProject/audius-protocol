import { ReactNode } from 'react'

import { BNWei } from '@audius/common/models'
import { formatWei } from '@audius/common/utils'

import Tooltip from 'components/tooltip/Tooltip'

type TokenHoverTooltipProps = {
  children: ReactNode
  balance: BNWei
  parentMount?: boolean
}

const TokenHoverTooltip = ({
  balance,
  children,
  parentMount = false
}: TokenHoverTooltipProps) => {
  return (
    <Tooltip
      text={`${formatWei(balance)} $AUDIO`}
      disabled={balance.isZero()}
      placement='top'
      mouseEnterDelay={0.2}
      mount={parentMount ? 'parent' : undefined}
    >
      {children}
    </Tooltip>
  )
}

export default TokenHoverTooltip
