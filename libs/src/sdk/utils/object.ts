// Return properties from a list that the object is missing
export const objectMissingProperties = (
  object: Record<string, any>,
  properties: string[]
) => {
  return properties.filter((p) => {
    return !Object.prototype.hasOwnProperty.call(object, p)
  })
}

// Return properties from a list for which the object is missing values
export const objectMissingValues = (
  object: Record<string, any>,
  properties: string[]
) => {
  return properties.filter(
    (p) => !Object.prototype.hasOwnProperty.call(object, p) || object[p] === ''
  )
}
