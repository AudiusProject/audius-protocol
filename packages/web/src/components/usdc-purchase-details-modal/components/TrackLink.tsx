import { useGetTrackById } from '@audius/common/api'
import { Text } from '@audius/harmony'
import { TextLink } from 'components/link'

export const TrackLink = (props: { id: number; onClick: () => void }) => {
  const { id, ...other } = props
  const { data: track } = useGetTrackById({ id })
  if (!track) return null
  return (
    <TextLink to={track.permalink} textVariant='body' size='l' {...other}>
      <Text ellipses>{track.title}</Text>
    </TextLink>
  )
}
