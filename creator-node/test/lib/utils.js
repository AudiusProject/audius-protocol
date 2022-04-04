const stringifiedDateFields = (obj) => {
  const newObj = { ...obj }
  if (newObj.createdAt) newObj.createdAt = newObj.createdAt.toISOString()
  if (newObj.updatedAt) newObj.updatedAt = newObj.updatedAt.toISOString()
  return newObj
}

const wait = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const functionThatThrowsWithMessage = (errorMessage) => {
  return function throwTestingError () {
    throw new Error(errorMessage)
  }
}

module.exports = { wait, stringifiedDateFields, functionThatThrowsWithMessage }
