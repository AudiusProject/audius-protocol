import {
  FieldHelperProps,
  FieldHookConfig,
  FieldMetaProps,
  FieldInputProps as FormikFieldInputProps,
  useFormikContext,
  useField as useFormikField
} from 'formik'
import { useDebouncedCallback } from './useDebouncedCallback'
import { useCallback, useEffect, useState } from 'react'

export type UseHarmonyFieldProps<Value> = FieldHookConfig<Value> & {
  /** Function to transform the input value on change, eg. a function to trim whitespace */
  transformValueOnChange?: (value: string) => string
  /** Function to transform the input value on blur, eg. a function to trim whitespace */
  transformValueOnBlur?: (value: string) => string
  /**
   * Debounces onChange validation.
   * Requires validateOnChange to be true (either for the form or this field).
   * @default 0
   */
  debouncedValidationMs?: number
  /**
   * Delays onChange validation errors from showing.
   * Requires validateOnChange to be true (either for the form or this field).
   * Note: This doesn't delay the actual validation from running,
   * just how long after the user stops typing that the error will appear.
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
   * If present, overrides the form's validateFieldOnChange
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
 * - Debounce validations and/or error displays to prevent error spam
 * - Allow overriding the Formik context's "validateOnChange"
 * @param propsOrFieldName the field's name, or the full props for the hook.
 * @example
 * const MyComponent = () => {
 *    const [emailField] = useHarmonyField({ name: 'email', label: 'Email' })
 *    return <TextInput {...field} />
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
    debouncedValidationMs = 0,
    debouncedIdleMs = 0,
    transformValueOnChange,
    transformValueOnBlur,
    showErrorBeforeSubmit = false,
    validateFieldOnChange
  } = props
  const [field, meta, helpers] = useFormikField(name)
  const { touched, error } = meta
  const { setValue, setTouched } = helpers
  const {
    validateField,
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

  // Debounced version of validate field
  const debouncedValidateField = useDebouncedCallback(
    () => validateField(name),
    [validateField, name],
    debouncedValidationMs
  )

  // Debounced function that mimics onBlur if the user stops typing for a bit
  const debouncedSetIdle = useDebouncedCallback(
    () => {
      setIsChanging(false)
      setTouched(true)
    },
    [setIsChanging, setTouched],
    debouncedIdleMs
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      // Add isChanging state so that errors don't show while typing
      setIsChanging(true)
      // Stop editing if the user stops typing for a while, so that any
      // errors can show through even if the input doesn't leave focus
      if (validateOnChange) {
        debouncedSetIdle()
      }

      // Apply value transformations
      if (transformValueOnChange) {
        e.target.value = transformValueOnChange(e.target.value)
      }

      // Formik's onChange is just setValue. Calling setValue explicitly
      // instead of onChange for more control and so Formik doesn't have to
      // infer the field name from the event target.
      if (validateOnChange && debouncedValidationMs) {
        // Explicitly skipping validating onChange here so the debouncing
        // effect can take care of it.
        setValue(e.target.value, false)
        debouncedValidateField()
      } else {
        // onChange in Formik respects validateOnChange by leaving the second
        // param undefined. Since this hook takes in an override, pass the
        // prop in explicitly to force validations or non-validations at will.
        setValue(e.target.value, validateOnChange)
      }
    },
    [
      transformValueOnChange,
      validateOnChange,
      debouncedValidationMs,
      debouncedValidateField,
      setValue,
      setIsChanging
    ]
  )

  const onBlur = useCallback(
    (e: React.FocusEvent<any>) => {
      // Remove isChanging state which will allow errors to show
      setIsChanging(false)

      // Apply value transformations
      if (transformValueOnBlur) {
        e.target.value = transformValueOnBlur(e.target.value)
      }

      // Formik's onBlur is just setTouched
      setTouched(true)
    },
    [transformValueOnBlur, setTouched, setIsChanging]
  )

  // When the submit count increases, the user must have submitted.
  // Mark the field as not being edited so that any submission errors appear.
  useEffect(() => {
    setIsChanging(false)
  }, [submitCount])

  const harmonyField = {
    ...field,
    error: hasError ? error : undefined,
    onChange,
    onBlur
  }

  return [harmonyField, meta, helpers]
}
