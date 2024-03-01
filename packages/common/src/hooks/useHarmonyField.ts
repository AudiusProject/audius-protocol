import { useCallback, useState } from 'react'

import {
  FieldHelperProps,
  FieldHookConfig,
  FieldMetaProps,
  FieldInputProps as FormikFieldInputProps,
  useFormikContext,
  useField as useFormikField
} from 'formik'

import { useDebouncedCallback } from './useDebouncedCallback'

/** Extracts the event target's value from the event for both React and ReactNative. */
const getEventTargetValue = (
  e: React.ChangeEvent<any> | React.FocusEvent<any>
) => e.target?.value ?? e.currentTarget?.value ?? (e as any).nativeEvent?.text

export type UseHarmonyFieldProps<Value> = FieldHookConfig<Value> & {
  /** Function to transform the input value on change, eg. a function to trim whitespace */
  transformValueOnChange?: (value: string) => string
  /** Function to transform the input value on blur, eg. a function to trim whitespace */
  transformValueOnBlur?: (value: string) => string
  /**
   * Delays onChange validation errors from showing. Useful for improving the
   * UX by not showing users the errors as they're typing into the form input.
   *
   * Note: This won't globally debounce validation for the form, just for this
   * field. Do not use this for eg. debouncing validation API requests unless y
   * you use it for _every_ field of the form (or other fields don't validate
   * on change). Otherwise changes to other fields will trigger non-debounced
   * validation requests anyway.
   *
   * Requires validateOnChange to be true (either for the form or this field).
   *
   * The default of 0 means errors will be hidden until the user unfocuses.
   *
   * @default 0
   */
  debouncedIdleMs?: number
  /**
   * Whether to show errors prior to the first submission attempt.
   * @default false
   */
  showErrorBeforeSubmit?: boolean
  /**
   * Whether to validate this particular field on change or not.
   * If present, overrides the form's validateFieldOnChange.
   * @default undefined
   */
  validateFieldOnChange?: boolean
}

/**
 * Wrapper around Formik's {@link useFormikField useField} that modifies the
 * returned results for Harmony compatible behavior, including the following
 * configurable behaviors:
 * - Only show errors after a submission has been attempted
 * - Apply transformations to the value on blur or change
 * - Debounce validations and error displays to lighten the validation
 *   workload or hide the errors while the user is still typing.
 * - Allow overriding the Formik context's "validateOnChange"
 *
 * Most of the extra functionality is reserved for fields that users type into,
 * eg. text, email, password inputs.
 * Unlike the useField hook from Formik, this implementation relies much less
 * on the event target in onChange and onBlur, instead using the passed in
 * field name path. This makes usage with ReactNative more straightforward.
 *
 * @param propsOrFieldName the field's name, or the full props for the hook.
 * @example
 * const MyComponent = () => {
 *    const [emailField, { error }] = useHarmonyField({ name: 'email', label: 'Email' })
 *    return <TextInput {...field} error={!!error} helperText={error} />
 * }
 */
export const useHarmonyField = <Value = any>(
  propsOrFieldName: string | UseHarmonyFieldProps<Value>
): [
  FormikFieldInputProps<Value>,
  FieldMetaProps<Value>,
  FieldHelperProps<Value>
] => {
  const props =
    typeof propsOrFieldName === 'string'
      ? { name: propsOrFieldName }
      : propsOrFieldName
  const {
    name,
    type = 'text',
    debouncedIdleMs = 0,
    transformValueOnChange,
    transformValueOnBlur,
    showErrorBeforeSubmit = false,
    validateFieldOnChange
  } = props
  const [field, meta, helpers] = useFormikField(props)
  const { touched, error } = meta
  const { setValue, setTouched } = helpers
  const {
    validateField,
    validateOnBlur,
    validateOnChange: validateFormOnChange,
    submitCount
  } = useFormikContext()

  // Tracks whether the user is actively editing the field
  const [isChanging, setIsChanging] = useState(false)

  // Combine the form validateOnChange prop with this field's prop
  const validateOnChange =
    validateFieldOnChange === undefined
      ? validateFormOnChange
      : validateFieldOnChange

  // Only show an error state if:
  // - There's an error in validation, AND
  // - The field has been touched (focused at least once), AND
  // - The field can error before submission or the form has been submitted at least once, AND
  // - The field is not currently being changed
  const hasError = Boolean(
    error &&
      touched &&
      (showErrorBeforeSubmit || submitCount > 0) &&
      !isChanging
  )

  /**
   * Sets the field to touched, validates it, and then sets isChanging to false.
   * Essentially mimicking onBlur but ensuring validation finishes before
   * allowing errors to show.
   */
  const validateAndSetIdle = useCallback(() => {
    // Cast result to promise (the types are wrong and validation is async)
    const maybePromise = setTouched(true) as Promise<void> | void
    // Wait for validation before confirming we're not editing
    if (maybePromise) {
      maybePromise.then(() => {
        setIsChanging(false)
      })
    } else {
      setIsChanging(false)
    }
  }, [name, validateField, setIsChanging, setTouched])

  // Debounced validateAndSetIdle for when the user stops typing for a bit
  const debouncedValidateAndSetIdle = useDebouncedCallback(
    validateAndSetIdle,
    [validateAndSetIdle],
    debouncedIdleMs
  )

  const onChangeText = useCallback(
    async (e: React.ChangeEvent<any>) => {
      // Add isChanging state so that errors don't show while typing.
      setIsChanging(true)

      // Extract value from event, taking care to get the nativeEvent.text
      // for ReactNative.
      let value = getEventTargetValue(e)

      // Apply value transformations
      if (transformValueOnChange) {
        value = transformValueOnChange(value)
      }

      // All Formik's onChange handler does for text fields is call setValue.
      // Calling setValue explicitly here instead of onChange for more control
      // of the validation and so Formik doesn't have to infer the field name.
      // Explicitly don't validate by setting the second param to false.
      // Await the resulting promise to ensure the value is set before validating.
      const maybePromise = setValue(value, false) as Promise<any> | void
      if (maybePromise) {
        await maybePromise
      }

      // Manually handle validation
      if (validateOnChange) {
        if (debouncedIdleMs) {
          // If debouncing, set the field to touched, validate, and set
          // isChanging to false after validating.
          debouncedValidateAndSetIdle()
        } else {
          // Don't set isChanging to false if not debouncing - let the
          // onBlur handler do that. But do validate the field.
          validateField(name)
        }
      }
    },
    [
      transformValueOnChange,
      validateOnChange,
      debouncedIdleMs,
      validateField,
      setValue,
      setIsChanging,
      debouncedValidateAndSetIdle
    ]
  )

  /**
   * Overrides the default Formik onBlur event in order to apply
   * transformations and toggle isChanging appropriately.
   */
  const onBlur = useCallback(
    (e: React.FocusEvent<any>) => {
      // Apply value transformations
      if (transformValueOnBlur) {
        let value = getEventTargetValue(e)
        value = transformValueOnBlur(e.target.value)
        setValue(value, false)
      }

      // Formik's onBlur is just setTouched, but we want to clear our
      // isChanging state once the validation finishes.
      if (validateOnBlur) {
        validateAndSetIdle()
      } else {
        setTouched(true, false)
        setIsChanging(false)
      }
    },
    [transformValueOnBlur, validateAndSetIdle]
  )

  /**
   * Overrides the default Formik onChange event for text-like inputs.
   *
   * Used to apply value transformations, validation debouncing, and ensure
   * the field name is associated properly.
   *
   * Since type is in scope here, avoiding the regex checks used in Formik's {@link https://github.com/jaredpalmer/formik/blob/0f960aaeeb0bdbef8312b5107cd3374884a0e62b/packages/formik/src/Formik.tsx#L639C9-L645C19 executeChange}
   * and comparing directly for text-like input types.
   */
  const onChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      if (
        type === 'text' ||
        type === 'email' ||
        type === 'password' ||
        type === 'search' ||
        type === 'url'
      ) {
        onChangeText(e)
      } else {
        field.onChange(e)
      }
    },
    [onChangeText, field.onChange, type]
  )

  // Override onChange, onBlur, and error
  return [
    {
      ...field,
      onChange,
      onBlur
    },
    { ...meta, error: hasError ? error : undefined },
    helpers
  ]
}
