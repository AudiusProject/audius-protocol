const models = require('../src/models')

const getCNodeUser = async (cnodeUserUUID) => {
  const { dataValues } = await models.CNodeUser.findOne({ where: { cnodeUserUUID } })
  return dataValues
}

const stringifiedDateFields = (obj) => {
  const newObj = { ...obj }
  if (newObj.createdAt) newObj.createdAt = newObj.createdAt.toISOString()
  if (newObj.updatedAt) newObj.updatedAt = newObj.updatedAt.toISOString()
  return newObj
}

const destroyUsers = async () => (
  models.CNodeUser.destroy({
    where: {},
    truncate: true,
    cascade: true // cascades delete to all rows with foreign key on cnodeUser
  })
)

module.exports = {
  getCNodeUser,
  stringifiedDateFields,
  destroyUsers
}
