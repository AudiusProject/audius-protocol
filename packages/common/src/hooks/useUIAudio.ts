import { useMemo } from 'react'

import { AUDIO } from '@audius/fixed-decimal'

import { StringWei } from '~/models/Wallet'

export const useUIAudio = (weiAudio: StringWei): number =>
  useMemo(
    () => parseInt(AUDIO(BigInt(weiAudio)).trunc().toString()),
    [weiAudio]
  )
