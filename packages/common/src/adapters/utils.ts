import { removeNullable } from '~/utils/typeUtils'

export const transformAndCleanList = <InputType, OutputType>(
  input: InputType[] | undefined,
  transformer: (v: InputType) => OutputType | undefined | null
): OutputType[] => {
  return input ? input.map(transformer).filter(removeNullable) : []
}
