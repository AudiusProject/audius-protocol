import App from "basekit/src/app";
import { Knex } from "knex"
import { Ok, Err, Result } from 'ts-results';
import { AudiusLibs } from "@audius/sdk";
import { SharedData } from "./config";
import {
  ChallengeDisbursementUserbank,
  ChallengeDisbursementUserbankFriendly,
  getChallengesDisbursementsUserbanks,
  getChallengesDisbursementsUserbanksFriendly,
  getTrendingChallenges,
} from "./queries";

// TODO: move something like this into App so results are commonplace for handlers
export const onCondition = async (app: App<SharedData>): Promise<void> => {
  const disburse = await onDisburse(app)
  disburse.mapErr(console.error)
}

export const onDisburse = async (app: App<SharedData>): Promise<Result<undefined, string>> => {
  const db = app.getDnDb();
  const libs = app.viewAppData().libs

  const startingBlockRes = await findStartingBlock(db)
  if (startingBlockRes.err) return startingBlockRes
  const [startingBlock, specifier] = startingBlockRes.unwrap()

  const nodeGroupsRes = await assembleNodeGroups(libs)
  if(nodeGroupsRes.err) return nodeGroupsRes
  const nodeGroups = nodeGroupsRes.unwrap()

  return new Ok(undefined)
};

const findStartingBlock = async (db: Knex): Promise<Result<[number, string], string>> => {
  const challenges = await getTrendingChallenges(db)
  const firstChallenge = challenges.at(0)
  if (firstChallenge === undefined) return new Err(`no challenges found ${challenges}`)
  const completedBlocknumber = firstChallenge.completed_blocknumber
  if (completedBlocknumber === null) return new Err(`completed block number is null ${firstChallenge}`)
  const specifier = firstChallenge.specifier
  return new Ok([completedBlocknumber, specifier])
}

// copied from libs because I couldn't figure out where to import it
type Node = {
  endpoint: string;
  spID?: string;
  owner: string;
  delegateOwnerWallet: string;
}

const assembleNodeGroups = async (libs: AudiusLibs): Promise<Result<Map<string, Node[]>, string>> => {
  const nodes = await libs.ServiceProvider?.discoveryProvider.serviceSelector.getServices({ verbose: true })
  if (nodes === undefined) return new Err("no nodes returned from libs service provider")
  const groups = new Map<string, Node[]>()
  for (const node of nodes) {
    const ownerNodes = groups.get(node.owner)
    if (ownerNodes === undefined) {
      groups.set(node.owner, [node])
    } else {
      ownerNodes.push(node)
      groups.set(node.owner, ownerNodes)
    }
  }
  return new Ok(groups)
}

const canSuccessfullyAttest = async (endpoint: string, specifier: string, userId: number, challengeId: number): Promise<Result<boolean, string>> => {
  return new Err("")
}
