import { useMemo } from 'react'

import BN from 'bn.js'

import { BNWei, StringWei } from '~/models/Wallet'
import { formatWei } from '~/utils/wallet'

export const useUIAudio = (weiAudio: StringWei): number =>
  useMemo(() => parseInt(formatWei(new BN(weiAudio) as BNWei), 10), [weiAudio])
