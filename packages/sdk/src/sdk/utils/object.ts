/**
 * Return properties from a list for which the object is missing values
 */
export const objectMissingValues = (
  object: Record<string, any>,
  properties: string[]
) => {
  return properties.filter((p) => object[p] === undefined || object[p] === null)
}
