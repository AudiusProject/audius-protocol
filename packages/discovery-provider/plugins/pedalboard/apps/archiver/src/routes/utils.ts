export const queryParamToBoolean = (param: unknown) => {
  if (!param || typeof param !== 'string') return false
  return ['true', '1'].includes(String(param).toLowerCase())
}
