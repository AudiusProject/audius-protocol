import { BPM_REGEX } from '@audius/common/utils'

import {
  UseRegexMaskedInputParams,
  useRegexMaskedInput
} from './useRegexMaskedInput'

type UseBpmMaskedInputParams = Omit<UseRegexMaskedInputParams, 'regex'>

/**
 * Mask BPM input values
 *
 * @example
 * const maskedInputProps = useBpmMaskedInput()
 * return <input {...maskedInputProps} />
 */
export const useBpmMaskedInput = (params?: UseBpmMaskedInputParams) =>
  useRegexMaskedInput({ regex: BPM_REGEX, onChange: params?.onChange })
