import { TextField } from './TextField'

export const EditTrackMetadataField = () => {
  return (
    <>
      <TextField name={'title'} label={'title'} />
      <TextField name={'genre'} label={'genre'} required />
    </>
  )
}
