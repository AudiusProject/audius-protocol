import { useEffect } from 'react'

import { useGetTrackByPermalink } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { getPathFromTrackUrl } from '@audius/common/utils'
import { Hint, IconQuestionCircle } from '@audius/harmony'
import { useField } from 'formik'
import { useSelector } from 'react-redux'
import { useThrottle } from 'react-use'

import { Divider } from 'components/divider'
import { TextField } from 'components/form-fields'

import { SwitchRowField } from '../SwitchRowField'
import { IS_STREAM_GATED, STREAM_CONDITIONS } from '../types'

import styles from './RemixSettingsField.module.css'
import { TrackInfo } from './TrackInfo'
import { CAN_REMIX_PARENT, IS_REMIX, REMIX_LINK, SHOW_REMIXES } from './types'
const { getUserId } = accountSelectors

const messages = {
  hideRemix: {
    header: 'Hide Remixes of This Track',
    description:
      'Prevent remixes of your track by other artists from appearing on your track page. '
  },
  remixOf: {
    header: 'Identify as Remix',
    description:
      'Link your remix to the original track to increase visibility and credit the original artist.',
    linkLabel: 'Enter an Audius Link'
  },
  changeAvailabilityPrefix: 'Availablity is set to ',
  changeAvailabilitySuffix:
    '. To enable these options, change availability to Public.',
  premium: 'Premium (Pay-to-Unlock)',
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access'
}

export const RemixSettingsMenuFields = () => {
  const [{ value: isStreamGated }] = useField(IS_STREAM_GATED)
  const [{ value: streamConditions }] = useField(STREAM_CONDITIONS)
  const [{ value: trackUrl }] = useField(REMIX_LINK)
  const [, , { setValue: setCanRemixParent }] = useField(CAN_REMIX_PARENT)
  const permalink = useThrottle(getPathFromTrackUrl(trackUrl), 1000)
  const currentUserId = useSelector(getUserId)

  const { data: track } = useGetTrackByPermalink(
    { permalink, currentUserId },
    { disabled: !permalink }
  )

  const trackId = track?.track_id
  const { hasStreamAccess: canRemixParent } = useGatedContentAccess(
    track ?? null
  )

  const [, , { setValue: setParentTrackId }] = useField('parentTrackId')

  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)

  useEffect(() => {
    setParentTrackId(trackId)
    setCanRemixParent(canRemixParent)
  }, [trackId, setParentTrackId, canRemixParent, setCanRemixParent])

  return (
    <div className={styles.fields}>
      {isStreamGated && !isUSDCPurchaseGated ? (
        <Hint icon={IconQuestionCircle}>{`${
          messages.changeAvailabilityPrefix
        } ${
          isContentCollectibleGated(streamConditions)
            ? messages.collectibleGated
            : messages.specialAccess
        }${messages.changeAvailabilitySuffix}`}</Hint>
      ) : null}
      <SwitchRowField
        name={SHOW_REMIXES}
        header={messages.hideRemix.header}
        description={messages.hideRemix.description}
        inverted
        {...(isStreamGated && !isUSDCPurchaseGated
          ? { checked: true, disabled: true }
          : {})}
      />

      <Divider />

      {isUSDCPurchaseGated ? (
        <Hint icon={IconQuestionCircle}>
          {`${messages.changeAvailabilityPrefix} ${messages.premium}${messages.changeAvailabilitySuffix}`}
        </Hint>
      ) : null}
      <SwitchRowField
        name={IS_REMIX}
        header={messages.remixOf.header}
        description={messages.remixOf.description}
        disabled={isStreamGated}
      >
        <TextField name={REMIX_LINK} label={messages.remixOf.linkLabel} />
        {track ? <TrackInfo trackId={track.track_id} /> : null}
      </SwitchRowField>
    </div>
  )
}
