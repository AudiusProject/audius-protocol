import { useField } from 'formik'

/**
 * Wrapper around Formik useField that gets onBlur and onChange that work for
 * the given field name.
 *
 * Formik expects "name" or "id" on the target of the change and blur events,
 * but the events look different in ReactNative and don't have those fields.
 * Fortunately, Formik has support for supplying the field name to its handler
 * directly and generate the event handler that way.
 *
 * @param name the field name
 */
export const useRNField = (name: string) => {
  const [field, meta, helpers] = useField(name)
  return [
    {
      ...field,
      onBlur: field.onBlur(field.name),
      onChange: field.onChange(field.name) as (e: any) => void // Formik expects a different event type
    },
    meta,
    helpers
  ] as const
}
