import { TextField, TextFieldProps } from 'components/form-fields'

const messages = {
  trackName: 'Track Name'
}

type TrackNameFieldProps = Partial<TextFieldProps> & {
  name: string
}

export const TrackNameField = (props: TrackNameFieldProps) => {
  return (
    <TextField label={messages.trackName} maxLength={64} required {...props} />
  )
}
