'use strict';
const models = require('../../src/models')

module.exports = {
  up: (queryInterface, Sequelize) => {
    // Add 'live' to "NotificatiionEmails" "emailFrequency"
    return queryInterface.sequelize.query(
      "ALTER TYPE \"enum_NotificationEmails_emailFrequency\" ADD VALUE 'live'"
    )
    // Change the default to 'live'
    .then(() => {
      return queryInterface.sequelize.query(
        "ALTER TABLE \"NotificationEmails\" ALTER \"emailFrequency\" set default 'live'::\"enum_NotificationEmails_emailFrequency\""
      )
    })
    // Add 'live' to "UserNotificationSettings" "emailFrequency"
    .then(() => {
      queryInterface.sequelize.query(
        "ALTER TYPE \"enum_UserNotificationSettings_emailFrequency\" ADD VALUE 'live'"
      )
    })
    // Change the default ot 'live'
    .then(() => {
      return queryInterface.sequelize.query(
        "ALTER TABLE \"UserNotificationSettings\" ALTER \"emailFrequency\" set default 'live'::\"enum_UserNotificationSettings_emailFrequency\""
      )
    })
    // Set all the users who have the default (daily) to live
    .then(() => {
      return models.UserNotificationSettings.update({
        emailFrequency: 'live'
      }, {
        where: { emailFrequency: 'daily' }
      })
    })
  },

  down: (queryInterface, Sequelize) => {
    // Set all the users who have the default (live) to daily
    return models.UserNotificationSettings.update({
      emailFrequency: 'daily'
    }, {
      where: { emailFrequency: 'live' }
    })
    // Change the default back to 'daily'
    .then(() => {
      queryInterface.sequelize.query(
        "ALTER TABLE \"NotificationEmails\" ALTER \"emailFrequency\" set default 'daily'::\"enum_NotificationEmails_emailFrequency\""
      )
    })
    // Delete 'live' from "NotificationEmails" "emailFrequency"
    .then(() => {
      const query = 'DELETE FROM pg_enum ' +
        'WHERE enumlabel = \'live\' ' +
        'AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = \'enum_NotificationEmails_emailFrequency\')'
      return queryInterface.sequelize.query(query)
    })
    // Change the default back to 'daily'
    .then(() => {
      return queryInterface.sequelize.query(
        "ALTER TABLE \"UserNotificationSettings\" ALTER \"emailFrequency\" set default 'daily'::\"enum_UserNotificationSettings_emailFrequency\""
      )
    })
    // Delete 'live' from "NotificationEmails" "emailFrequency"
    .then(() => {
      const query = 'DELETE FROM pg_enum ' +
        'WHERE enumlabel = \'live\' ' +
        'AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = \'enum_UserNotificationSettings_emailFrequency\')'
      return queryInterface.sequelize.query(query)
    })
  }
};
