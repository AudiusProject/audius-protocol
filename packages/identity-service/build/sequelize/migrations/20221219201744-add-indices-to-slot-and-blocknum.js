'use strict';
module.exports = {
    up: (queryInterface) => {
        return queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "solana_notifications_slot_idx" on "SolanaNotifications" ("slot")`, { transaction });
            await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "notifications_blocknumber_idx" on "Notifications" ("blocknumber")`, { transaction });
        });
    },
    down: (queryInterface) => {
        return queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "solana_notifications_slot_idx"`, { transaction });
            await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "notifications_blocknumber_idx"`, { transaction });
        });
    }
};
