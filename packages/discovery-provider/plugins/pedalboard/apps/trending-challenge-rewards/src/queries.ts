import { Knex } from 'knex'
import { Table, UserChallenges } from '@pedalboard/storage'

export type ChallengeDisbursementUserbank = {
  challenge_id: string
  completed_blocknumber: number
  handle: string
  user_id: number
  ethereum_address: string
  specifier: string
  slot: null | string
}

export type ChallengeDisbursementUserbankFriendly = {
  challenge_id: string
  handle: string
  user_id: number
  specifier: string
  completed_blocknumber: number
  slot: null | string
}

export const getChallengesDisbursementsUserbanks = async (
  discoveryDb: Knex,
  specifier: string
): Promise<ChallengeDisbursementUserbank[]> =>
  await discoveryDb<ChallengeDisbursementUserbank>('user_challenges as u')
    .select(
      'u.challenge_id',
      'u.completed_blocknumber',
      'users.handle',
      'u.user_id',
      'b.ethereum_address',
      'u.specifier',
      'c.slot'
    )
    .leftJoin('challenge_disbursements as c', function () {
      this.on('u.specifier', '=', 'c.specifier').andOn(
        'u.challenge_id',
        '=',
        'c.challenge_id'
      )
    })
    .join('users', 'users.user_id', '=', 'u.user_id')
    .leftJoin(
      'user_bank_accounts as b',
      'b.ethereum_address',
      '=',
      'users.wallet'
    )
    .where('u.specifier', '~', specifier)
    .where('users.is_current', true)

export const getChallengesDisbursementsUserbanksFriendly = async (
  discoveryDb: Knex,
  specifier: string
): Promise<ChallengeDisbursementUserbankFriendly[]> => {
  const query =  discoveryDb<ChallengeDisbursementUserbankFriendly>(
    'user_challenges as u'
  )
    .select(
      'u.challenge_id',
      'users.handle',
      'u.user_id',
      'u.specifier',
      'u.completed_blocknumber',
      'c.slot'
    )
    .leftJoin('challenge_disbursements as c', function () {
      this.on('u.specifier', '=', 'c.specifier').andOn(
        'u.challenge_id',
        '=',
        'c.challenge_id'
      )
    })
    .join('users', 'users.user_id', '=', 'u.user_id')
    .where('u.specifier', '~', specifier)
    .where('users.is_current', true)
    .orderBy('u.challenge_id')
    .orderBy('u.specifier')

    return await query
  }

export const getChallengesDisbursementsUserbanksFriendlyEnsureSlots = async (
  discoveryDb: Knex,
  specifier: string
): Promise<ChallengeDisbursementUserbankFriendly[]> => {
  return await getChallengesDisbursementsUserbanksFriendly(discoveryDb, specifier)
}

export const getTrendingChallenges = async (
  discoveryDb: Knex
): Promise<UserChallenges[]> =>
  discoveryDb
    .select()
    .from<UserChallenges>(Table.UserChallenges)
    // only use tt because we just need a trending challenge
    .where('challenge_id', '=', 'tt')
    .orderBy('completed_blocknumber', 'desc')
    .limit(100)
