import { ReactNode } from 'react'

import { BNWei } from 'common/models/Wallet'
import { formatWei } from 'common/utils/wallet'
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
      mount={parentMount ? 'parent' : undefined}>
      {children}
    </Tooltip>
  )
}

export default TokenHoverTooltip
