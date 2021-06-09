// Auto-increment the uid so that items with the
// same kind, id, and source have unique IDs
let count = 0

export class Uid {
  constructor(kind, id, source, count = 0) {
    this.kind = kind
    this.id = id
    this.source = source
    this.count = count
  }

  static build(kind, id, source, addedCount = 0) {
    const count = Uid._getCount()
    return new Uid(kind, id, source, count + addedCount)
  }

  static fromString(uid) {
    const kind = Uid.getComponent(uid, 'kind')
    const id = parseInt(Uid.getComponent(uid, 'id'))
    const source = Uid.getComponent(uid, 'source')
    const count = Uid.getComponent(uid, 'count')
    return new Uid(kind, id, source, count)
  }

  static getComponent = (uid, componentName) => {
    const components = uid.split('-')
    const kind = components.find(component =>
      component.startsWith(`${componentName}:`)
    )
    if (!kind) return ''
    return kind.substring(componentName.length + 1)
  }

  toString = () => {
    return `kind:${this.kind}-id:${this.id}${
      this.source ? `-source:${this.source}` : ''
    }-count:${this.count}`
  }

  static _getCount() {
    count += 1
    return count
  }
}

export function makeUids(kinds, ids, source) {
  if (Array.isArray(kinds)) {
    // Multiple kinds in the ids array.
    const totals = {}
    const counts = {}
    ids.forEach((id, i) => {
      const key = `${kinds[i]}${id}`
      if (key in totals) totals[key] += 1
      else totals[key] = 0
      counts[i] = totals[key]
    })
    const uids = ids.map((id, i) => Uid.build(kinds[i], id, source, counts[i]))
    return uids.map(uid => uid.toString())
  } else {
    // Single kind.
    const kind = kinds

    const totals = {}
    const counts = {}
    ids.forEach((id, i) => {
      if (id in totals) totals[id] += 1
      else totals[id] = 0
      counts[i] = totals[id]
    })
    const uids = ids.map((id, i) => Uid.build(kind, id, source, counts[i]))
    return uids.map(uid => uid.toString())
  }
}

export function makeUid(kind, id, source) {
  const uid = Uid.build(kind, id, source)
  return uid.toString()
}

/**
 * A persistant identifier for a resource for re-use within a session.
 * Differs from a uid, which represents an instance.
 * @param {Kind} kind
 * @param {ID} id
 */
export const makeKindId = (kind, id) => `${kind}-${id}`

/**
 * Gets the id from a kind id
 * @param {String} kindId
 */
export const getIdFromKindId = kindId => kindId.split('-')[1]

/**
 * Gets the kind from a kind id
 * @param {String} kindId
 */
export const getKindFromKindId = kindId => kindId.split('-')[0]

export const uuid = () => {
  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/873856#873856
  const s = []
  const hexDigits = '0123456789abcdef'
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'

  const uuid = s.join('')
  return uuid
}
