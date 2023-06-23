import { TextField } from 'app/components/fields'

const messages = {
  label: 'Name'
}

export const PlaylistNameField = () => {
  return <TextField required name='playlist_name' label={messages.label} />
}
