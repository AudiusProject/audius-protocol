'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS "Files" (
        "id" SERIAL PRIMARY KEY,
        "ownerId" INTEGER NOT NULL,
        "multihash" TEXT NOT NULL,
        "sourceFile" TEXT,
        "storagePath" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("ownerId") REFERENCES "Users" ("id") ON DELETE RESTRICT
      )
    `
    )
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Files')
  }
}
