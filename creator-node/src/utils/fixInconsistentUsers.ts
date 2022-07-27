import * as models from '../models'

export const fixInconsistentUser = async (wallet: string) => {
  models.sequelize.query(
    `
    UPDATE "CNodeUsers"
    SET clock = subquery.max_clock
    FROM (
        SELECT "walletPublicKey", MAX(clock) AS max_clock
        FROM "ClockRecords"
        WHERE "walletPublicKey" = :wallet
        GROUP BY "walletPublicKey"
    ) AS subquery
    WHERE "walletPublicKey" = :wallet
    AND subquery."walletPublicKey" = :wallet
    `,
    {
      replacements: { wallet }
    }
  )
}
