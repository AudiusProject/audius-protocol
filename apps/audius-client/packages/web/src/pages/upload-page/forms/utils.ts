import { useField } from 'formik'

const getFieldName = (base: string, index: number, path: string) =>
  `${base}.${index}.${path}`

const useIndexedField = <T>(base: string, index: number, path: string) => {
  return useField<T>(getFieldName(base, index, path))
}

export const getTrackFieldName = (index: number, path: string) => {
  return getFieldName('trackMetadatas', index, path)
}

export const useTrackField = <T>(path: string) => {
  const [{ value: index }] = useField('trackMetadatasIndex')
  return useIndexedField<T>('trackMetadatas', index, path)
}
