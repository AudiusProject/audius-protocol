// Uncomment this migration after all nodes have at least v0.3.69.
// This is done to avoid blocking since creating this index takes a long time (~2000 seconds).
// See https://linear.app/audius/issue/CON-477/use-proper-migration-for-storagepath-index-on-files-table
'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addIndex('Files', ['storagePath'], {
    //   name: 'Files_storagePath_idx',
    //   using: 'btree',
    //   concurrently: true
    // })
  },
  down: async (queryInterface, Sequelize) => {
    // await queryInterface.removeIndex('Files', 'Files_storagePath_idx')
  }
}
