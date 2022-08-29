'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserBankTransactionMetadata = sequelize.define(
    'UserBankTransactionMetadata',
    {
      transactionSignature: {
        type: DataTypes.STRING,
        alllowNull: false,
        primaryKey: true
      },
      metadata: {
        type: DataTypes.JSONB,
        alllowNull: false
      }
    },
    {}
  )
  UserBankTransactionMetadata.associate = function (models) {
    // associations can be defined here
  }
  return UserBankTransactionMetadata
}
