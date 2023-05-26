import { Knex } from "knex";
import { Table } from "storage";

export const getChallengesDisbursementsUserbanks = async (
  discoveryDb: Knex
) => {};

export const getChallengesDisbursementsUserbanksFriendly = async (
  discoveryDb: Knex
) => {};

export const getStartBlock = async (discoveryDb: Knex) =>
  discoveryDb(Table.UserChallenges)
    .where("challenge_id", "=", "tt")
    .orderBy("completed_blocknumber", "desc")
    .limit(100);
