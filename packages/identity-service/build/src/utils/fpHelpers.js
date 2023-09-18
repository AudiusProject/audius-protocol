"use strict";
const { QueryTypes } = require('sequelize');
const models = require('../models');
const getDeviceIDCountForUserId = async (userId) => {
    // Get the # of users sharing any visitorID
    // associated with `userId` on any platform
    const res = await models.sequelize.query(`select "Fingerprints"."userId"
     from "Fingerprints"
     where "visitorId" in (
      select distinct "visitorId"
      from "Fingerprints"
      where "userId" = :userId
    ) group by "Fingerprints"."userId"`, {
        replacements: {
            userId
        },
        type: QueryTypes.SELECT
    });
    return res.length;
};
module.exports = {
    getDeviceIDCountForUserId
};
