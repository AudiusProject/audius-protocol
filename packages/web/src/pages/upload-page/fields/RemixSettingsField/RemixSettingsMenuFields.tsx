import { useEffect } from 'react'

import {
  getPathFromTrackUrl,
  useGetTrackByPermalink,
  accountSelectors
} from '@audius/common'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import { Divider } from 'components/divider'
import { TextField } from 'components/form-fields'

import { SwitchRowField } from '../SwitchRowField'

import styles from './RemixSettingsField.module.css'
import { TrackInfo } from './TrackInfo'
import { IS_REMIX, REMIX_LINK, SHOW_REMIXES } from './types'
const { getUserId } = accountSelectors

const messages = {
  hideRemix: {
    header: 'Hide Remixes of This Track',
    description:
      'Enable this option if you want to prevent remixes of your track by other artists from appearing on your track page.'
  },
  remixOf: {
    header: 'Identify as Remix',
    description:
      "Paste the original Audius track link if yours is a remix. Your remix will typically appear on the original track's page.",
    linkLabel: 'Link to Remix'
  }
}

export const RemixSettingsMenuFields = () => {
  const [{ value: trackUrl }] = useField(REMIX_LINK)
  const permalink = getPathFromTrackUrl(trackUrl)
  const currentUserId = useSelector(getUserId)
  const { data: track } = useGetTrackByPermalink(
    { permalink, currentUserId },
    { disabled: !permalink }
  )

  const trackId = track?.track_id
  const [, , { setValue: setParentTrackId }] = useField('parentTrackId')

  useEffect(() => {
    setParentTrackId(trackId)
  }, [trackId, setParentTrackId])

  return (
    <div className={styles.fields}>
      <SwitchRowField
        name={SHOW_REMIXES}
        header={messages.hideRemix.header}
        description={messages.hideRemix.description}
        inverted
      />
      <Divider />
      <SwitchRowField
        name={IS_REMIX}
        header={messages.remixOf.header}
        description={messages.remixOf.description}
      >
        <TextField name={REMIX_LINK} label={messages.remixOf.linkLabel} />
        {track ? <TrackInfo trackId={track.track_id} /> : null}
      </SwitchRowField>
    </div>
  )
}
