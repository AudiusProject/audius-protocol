import { useMemo } from 'react'

import BN from 'bn.js'

import { BNWei, StringWei } from 'common/models/Wallet'
import { formatWei } from 'common/utils/wallet'

export const useUIAudio = (weiAudio: StringWei): number =>
  useMemo(() => parseInt(formatWei(new BN(weiAudio) as BNWei), 10), [weiAudio])
