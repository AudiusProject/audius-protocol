export const MUSICAL_KEYS = [
  'C',
  'C#/D♭',
  'D',
  'D#/E♭',
  'D',
  'E',
  'F',
  'F#/G♭',
  'G',
  'G#/A♭',
  'A',
  'A#/B♭',
  'B'
]

/**
 * Parses a music key from the frontend representation to the backend representation
 *
 * e.g.
 * Ab Major -> A flat major
 */
export const formatMusicalKey = (key?: string) => {
  if (!key) return undefined
  const keyParts = key.split(' ')
  const pitch = keyParts[0].slice(0, 1)
  const isFlat = keyParts[0].length > 1
  return `${pitch}${isFlat ? ' flat' : ''} ${keyParts[1].toLowerCase()}`
}

/**
 * Formats a music key from the backend representation to the frontend representation
 *
 * e.g.
 * A flat major -> Ab Major
 */
export const parseMusicalKey = (key?: string) => {
  if (!key) return undefined
  const keyParts = key.split(' ')
  const pitch = keyParts[0]
  const isFlat = keyParts[1] === 'flat'
  const scale = keyParts[isFlat ? 2 : 1] ?? 'major'
  return `${pitch}${isFlat ? '♭' : ''} ${
    scale.charAt(0).toUpperCase() + scale.slice(1)
  }`
}
