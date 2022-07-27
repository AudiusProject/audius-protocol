import { useMemo } from 'react'

import { BNWei, StringWei } from '@audius/common'
import BN from 'bn.js'

import { formatWei } from 'common/utils/wallet'

export const useUIAudio = (weiAudio: StringWei): number =>
  useMemo(() => parseInt(formatWei(new BN(weiAudio) as BNWei), 10), [weiAudio])
