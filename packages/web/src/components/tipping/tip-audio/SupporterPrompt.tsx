import { useSupporterPrompt } from '@audius/common/hooks'
import { StringKeys } from '@audius/common/services'
import { formatWei } from '@audius/common/utils'
import { IconTrophy } from '@audius/harmony'

import { useRemoteVar } from 'hooks/useRemoteConfig'

import styles from './TipAudio.module.css'

const messages = {
  becomeFirstSupporter: 'Send A Tip To Become Their First Supporter',
  becomeTopSupporterPrefix: 'Send ',
  becomeTopSupporterSuffix: ' $AUDIO To Become Top Supporter'
}

type SupporterPromptProps = {
  receiverId?: number | null
}

export const SupporterPrompt = ({ receiverId }: SupporterPromptProps) => {
  const { amountToDethrone, isFirstSupporter, isPending } =
    useSupporterPrompt(receiverId)
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  if (isPending) return null

  if (!audioFeaturesDegradedText && !isFirstSupporter && !amountToDethrone)
    return null

  return (
    <div className={styles.topBanner}>
      {!audioFeaturesDegradedText && <IconTrophy color='staticWhite' />}
      <span className={styles.topBannerText}>
        {audioFeaturesDegradedText ||
          (isFirstSupporter ? (
            messages.becomeFirstSupporter
          ) : (
            <>
              {messages.becomeTopSupporterPrefix}
              <span className={styles.amount}>
                {formatWei(amountToDethrone!, true, 0)}
              </span>
              {messages.becomeTopSupporterSuffix}
            </>
          ))}
      </span>
    </div>
  )
}
