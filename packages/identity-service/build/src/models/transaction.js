'use strict';
module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        encodedNonceAndSignature: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
        },
        decodedABI: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        receipt: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        contractRegistryKey: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contractFn: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contractAddress: {
            type: DataTypes.STRING,
            allowNull: false
        },
        senderAddress: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {});
    Transaction.associate = function (models) {
        // associations can be defined here
    };
    return Transaction;
};
