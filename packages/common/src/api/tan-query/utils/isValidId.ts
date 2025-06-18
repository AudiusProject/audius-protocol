export const isValidId = (id: number | null | undefined | string) => {
  return !!id && typeof id === 'number' && id > 0
}
