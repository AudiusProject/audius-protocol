export const stripLeadingSlash = (input) => {
  if (input[0] === '/') {
    return input.slice(1)
  }
  return input
}
