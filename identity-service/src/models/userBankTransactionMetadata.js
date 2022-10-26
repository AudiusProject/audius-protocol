'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserBankTransactionMetadata = sequelize.define(
    'UserBankTransactionMetadata',
    {
      userId: {
        type: DataTypes.INTEGER
      },
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
    {
      indexes: [
        {
          fields: ['userId'],
          name: 'idx_user_bank_transaction_metadata_user_id'
        }
      ]
    }
  )
  UserBankTransactionMetadata.associate = function (models) {
    // associations can be defined here
  }
  return UserBankTransactionMetadata
}
