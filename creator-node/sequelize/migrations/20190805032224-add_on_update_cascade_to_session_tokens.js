'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`ALTER TABLE "public"."SessionTokens" 
    DROP CONSTRAINT "SessionTokens_cnodeUserUUID_fkey",
    ADD CONSTRAINT "SessionTokens_cnodeUserUUID_fkey" FOREIGN KEY ("cnodeUserUUID") 
    REFERENCES "public"."CNodeUsers" ("cnodeUserUUID") ON DELETE RESTRICT ON UPDATE CASCADE;`)
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
}
