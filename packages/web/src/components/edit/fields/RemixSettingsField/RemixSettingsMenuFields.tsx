import { useEffect } from 'react'

import { useTrackByPermalink } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { getPathFromTrackUrl } from '@audius/common/utils'
import { useField } from 'formik'
import { useThrottle } from 'react-use'

import { Divider } from 'components/divider'
import { TextField } from 'components/form-fields'

import { SwitchRowField } from '../SwitchRowField'

import styles from './RemixSettingsField.module.css'
import { TrackInfo } from './TrackInfo'
import { CAN_REMIX_PARENT, IS_REMIX, REMIX_LINK, SHOW_REMIXES } from './types'

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
    linkLabel: 'Link to original track'
  }
}

export const RemixSettingsMenuFields = () => {
  const [{ value: trackUrl }] = useField(REMIX_LINK)
  const [, , { setValue: setCanRemixParent }] = useField(CAN_REMIX_PARENT)
  const permalink = useThrottle(getPathFromTrackUrl(trackUrl), 1000)

  const { data: track } = useTrackByPermalink(permalink)

  const trackId = track?.track_id
  const { hasStreamAccess: canRemixParent } = useGatedContentAccess(
    track ?? null
  )

  const [, , { setValue: setParentTrackId }] = useField('parentTrackId')

  useEffect(() => {
    setParentTrackId(trackId)
    setCanRemixParent(canRemixParent)
  }, [trackId, setParentTrackId, canRemixParent, setCanRemixParent])

  return (
    <div className={styles.fields}>
      <SwitchRowField
        name={IS_REMIX}
        header={messages.remixOf.header}
        description={messages.remixOf.description}
      >
        <TextField name={REMIX_LINK} label={messages.remixOf.linkLabel} />
        {track ? <TrackInfo trackId={track.track_id} /> : null}
      </SwitchRowField>

      <Divider />

      <SwitchRowField
        name={SHOW_REMIXES}
        header={messages.hideRemix.header}
        description={messages.hideRemix.description}
        inverted
      />
    </div>
  )
}
