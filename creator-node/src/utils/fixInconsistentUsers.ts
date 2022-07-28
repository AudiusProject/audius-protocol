import * as models from '../models'

/**
 * Given a user's UUID, this function will set their clock value equal to the max clock value
 * found in the ClockRecords table for that same user
 *
 * @param userUUID the UUID for the user whose clock needs to be made consistent
 */
export const fixInconsistentUser = async (userUUID: string) => {
  models.sequelize.query(
    `
    UPDATE "CNodeUsers" as cnodeusers
    SET clock = subquery.max_clock
    FROM (
        SELECT "cnodeUserUUID", MAX(clock) AS max_clock
        FROM "ClockRecords"
        WHERE "cnodeUserUUID" = :userUUID
        GROUP BY "cnodeUserUUID"
    ) AS subquery
    WHERE cnodeusers."cnodeUserUUID" = subquery."cnodeUserUUID"
    `,
    {
      replacements: { userUUID }
    }
  )
}

module.exports = {
  fixInconsistentUser
}
