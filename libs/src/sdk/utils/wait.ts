export const wait = async (milliseconds: number) => {
  return await new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}
