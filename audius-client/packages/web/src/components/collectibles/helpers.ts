/**
 * Generate a short base36 hash for a given string.
 * Used to generate short hashes for for queries and urls.
 * @param {string} str
 * @returns {string} hash
 */
export const getHash = (str: string) =>
  Math.abs(
    str.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
  ).toString(36)
