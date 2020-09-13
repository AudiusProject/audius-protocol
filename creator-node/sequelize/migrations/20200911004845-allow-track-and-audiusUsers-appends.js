'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      BEGIN;
      -- replace a table in place with extra trackBlockchainId column
      CREATE TABLE "Files_new" ( like "Files" );
      ALTER TABLE "Files_new" ADD COLUMN "trackBlockchainId" INTEGER;
      INSERT INTO "Files_new" (SELECT f.*, t."blockchainId" FROM "Files" f LEFT OUTER JOIN "Tracks" t ON f."trackUUID" = t."trackUUID");
      ALTER TABLE "Files_new" DROP COLUMN "trackUUID";
      ALTER TABLE "Files" RENAME TO "Files_old";
      ALTER TABLE "Files_new" RENAME TO "Files";
      DROP TABLE "Files_old" CASCADE;

      -- add back unique and pkey
      ALTER TABLE "Files" ADD CONSTRAINT "Files_fileUUID_key" UNIQUE ("fileUUID");
      ALTER TABLE "Files" ADD PRIMARY KEY ("fileUUID");

      -- add back indexes
      CREATE INDEX "Files_multihash_idx" ON public."Files" USING btree (multihash);
      CREATE INDEX "Files_cnodeUserUUID_idx" ON public."Files" USING btree ("cnodeUserUUID");
      CREATE INDEX "Files_dir_multihash_idx" ON public."Files" USING btree ("dirMultihash");
      CREATE INDEX "Files_trackBlockchainId_idx" ON public."Files" USING btree ("trackBlockchainId");

      -- add in the foreign key constraint from Files to other tables
      -- No fkey from Files to Tracks because we don't have a unique constraint on trackUUID or blockchainId on Tracks so postgres would reject the fkey
      ALTER TABLE "Files" ADD CONSTRAINT "Files_cnodeUserUUID_fkey" FOREIGN KEY ("cnodeUserUUID") REFERENCES "CNodeUsers" ("cnodeUserUUID") ON DELETE RESTRICT;

      -- 5 foreign key constraints get dropped in the CASCADE, so add them back in for the new table
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_coverArtFileUUID_fkey" FOREIGN KEY ("coverArtFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_metadataFileUUID_fkey" FOREIGN KEY ("metadataFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "AudiusUsers" ADD CONSTRAINT "AudiusUsers_profilePicFileUUID_fkey" FOREIGN KEY ("profilePicFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_coverArtFileUUID_fkey " FOREIGN KEY ("coverArtFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;
      ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_metadataFileUUID_fkey" FOREIGN KEY ("metadataFileUUID") REFERENCES "Files" ("fileUUID") ON DELETE RESTRICT;

      -- remove the unique constraints from Tracks
      ALTER TABLE "Tracks" DROP CONSTRAINT "Tracks_trackUUID_key";
      ALTER TABLE "Tracks" DROP CONSTRAINT "blockchainId_unique_idx";

      -- remove the trackUUID column from Tracks
      ALTER TABLE "Tracks" DROP COLUMN "trackUUID";

      -- remove the unique constraint from AudiusUsers
      ALTER TABLE "AudiusUsers" DROP CONSTRAINT "AudiusUsers_audiusUserUUID_key";

      -- remove the audiusUserUUID field as the AudiusUsers pkey
      ALTER TABLE "AudiusUsers" DROP CONSTRAINT "AudiusUsers_pkey";

      -- remove the trackUUID column from Tracks
      ALTER TABLE "AudiusUsers" DROP COLUMN "audiusUserUUID";

      COMMIT;
    `)
    // TODO - add a primary key to Tracks (blockchainId:clock)
    // TODO - add a primary key to AudiusUsers (blockchainId:clock)
  },

  down: (queryInterface, Sequelize) => {
    /*
      The up migration destroys tons of information, if we need to revert the best option is to restore from a snapshot
    */
  }
};
