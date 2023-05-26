import { Knex } from "knex";
import { Table, UserChallenges } from "storage";

type ChallengeDisbursementUserbank = {
  challenge_id: string;
  completed_blocknumber: number;
  handle: string;
  user_id: number;
  ethereum_address: string;
  specifier: string;
  slot: null | string;
};

type ChallengeDisbursementUserbankFriendly = {
  challenge_id: string;
  handle: string;
  user_id: number;
  specifier: string;
  completed_blocknumber: number;
  slot: null | string;
};

export const getChallengesDisbursementsUserbanks = async (
  discoveryDb: Knex
): Promise<ChallengeDisbursementUserbank[]> =>
  await discoveryDb<ChallengeDisbursementUserbank>("user_challenges as u")
    .select(
      "u.challenge_id",
      "u.completed_blocknumber",
      "users.handle",
      "u.user_id",
      "b.ethereum_address",
      "u.specifier",
      "c.slot"
    )
    .leftJoin("challenge_disbursements as c", function () {
      this.on("u.specifier", "=", "c.specifier").andOn(
        "u.challenge_id",
        "=",
        "c.challenge_id"
      );
    })
    .join("users", "users.user_id", "=", "u.user_id")
    .leftJoin(
      "user_bank_accounts as b",
      "b.ethereum_address",
      "=",
      "users.wallet"
    )
    .where("u.specifier", "~", "2022-05-27")
    .where("users.is_current", true);

export const getChallengesDisbursementsUserbanksFriendly = async (
  discoveryDb: Knex
): Promise<ChallengeDisbursementUserbankFriendly[]> =>
  await discoveryDb<ChallengeDisbursementUserbankFriendly>(
    "user_challenges as u"
  )
    .select(
      "u.challenge_id",
      "users.handle",
      "u.user_id",
      "u.specifier",
      "u.completed_blocknumber",
      "c.slot"
    )
    .leftJoin("challenge_disbursements as c", function () {
      this.on("u.specifier", "=", "c.specifier").andOn(
        "u.challenge_id",
        "=",
        "c.challenge_id"
      );
    })
    .join("users", "users.user_id", "=", "u.user_id")
    .where("u.specifier", "~", "2023-04-28")
    .where("users.is_current", true)
    .orderBy("u.challenge_id")
    .orderBy("u.specifier");

export const getStartBlock = async (
  discoveryDb: Knex
): Promise<UserChallenges[]> =>
  discoveryDb
    .select()
    .from<UserChallenges>(Table.UserChallenges)
    .where("challenge_id", "=", "tt")
    .orderBy("completed_blocknumber", "desc")
    .limit(100);
