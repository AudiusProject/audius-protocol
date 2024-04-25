import { Maybe } from '@audius/common/utils'
import { useField } from 'formik'

const getFieldName = (base: string, index: number, path: string) =>
  `${base}.${index}.${path}`

export const useIndexedField = <T>(
  base: string,
  index: Maybe<number>,
  path: string
) => {
  const fieldName = index === undefined ? path : getFieldName(base, index, path)
  return useField<T>(fieldName)
}

export const getTrackFieldName = (index: number, path: string) => {
  return getFieldName('trackMetadatas', index, path)
}

export const useTrackField = <T>(path: string) => {
  const [{ value: index }] = useField('trackMetadatasIndex')
  return useIndexedField<T>('trackMetadatas', index, path)
}
