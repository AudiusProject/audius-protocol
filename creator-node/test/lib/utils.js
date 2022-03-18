const stringifiedDateFields = (obj) => {
  const newObj = { ...obj }
  if (newObj.createdAt) newObj.createdAt = newObj.createdAt.toISOString()
  if (newObj.updatedAt) newObj.updatedAt = newObj.updatedAt.toISOString()
  return newObj
}

const wait = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const functionThatThrowsWithMessage = (errorMessage) => {
  return function throwTestingError() {
    throw new Error(errorMessage)
  }
}

function deepEqual(object1, object2, fieldsToIgnore = []) {
  const fieldsToIgnoreSet = new Set(fieldsToIgnore)
  const keys1 = Object.keys(object1).filter(
    (key) => !fieldsToIgnoreSet.has(key)
  )
  const keys2 = Object.keys(object2).filter(
    (key) => !fieldsToIgnoreSet.has(key)
  )
  if (keys1.length !== keys2.length) {
    return false
  }
  for (const key of keys1) {
    const val1 = object1[key]
    const val2 = object2[key]
    const areObjects = isObject(val1) && isObject(val2)
    if (
      (areObjects && !deepEqual(val1, val2)) ||
      (!areObjects && val1 !== val2)
    ) {
      return false
    }
  }
  return true
}

function isObject(object) {
  return object != null && typeof object === 'object'
}

module.exports = {
  wait,
  stringifiedDateFields,
  functionThatThrowsWithMessage,
  deepEqual
}
