import * as models from '../models'

export const fixInconsistentUser = async (userId: string) => {
  models.sequelize.query(
    `
    UPDATE "CNodeUsers" as cnodeusers
    SET clock = subquery.max_clock
    FROM (
        SELECT "cnodeUserUUID", MAX(clock) AS max_clock
        FROM "ClockRecords"
        WHERE "cnodeUserUUID" = :userId
        GROUP BY "cnodeUserUUID"
    ) AS subquery
    WHERE cnodeusers."cnodeUserUUID" = subquery."cnodeUserUUID"
    `,
    {
      replacements: { userId }
    }
  )
}

module.exports = {
  fixInconsistentUser
}
