import { AudiusLibs, AudiusSdk, sdk } from "@audius/sdk";
import App from "basekit/src/app";
import moment from "moment";
import dotenv from 'dotenv'
import { initAudiusLibs } from "./libs";
import { Err, Ok, Result } from "ts-results";

export type SharedData = {
  oracleEthAddress: string;
  AAOEndpoint: string;
  feePayerOverride: string;
  libs: AudiusLibs;
  sdk: AudiusSdk;
  localEndpoint: string;
  dryRun: boolean
};

export const initSharedData = async (): Promise<Result<SharedData, string>> => {
  dotenv.config()

  const audiusSdk = sdk({ appName: "trending-challenge-rewards-plugin" });
  const libs = await initAudiusLibs();

    // default to true if undefined, otherwise explicitly state false to not do dry run
  const dryRun = !((process.env.dryRun || "true").toLocaleLowerCase() === "false")

  const oracleEthAddress = process.env.oracleEthAddress
  const AAOEndpoint = process.env.AAOEndpoint
  const feePayerOverride = process.env.feePayerOverride
  const localEndpoint = process.env.localEndpoint

  if (oracleEthAddress === undefined) return new Err("oracleEthAddress defined")
  if (AAOEndpoint === undefined) return new Err("AAOEndpoint undefined")
  if (feePayerOverride === undefined) return new Err("feePayerOverride undefined")
  if (localEndpoint === undefined) return new Err("localEndpoint undefined")

  return new Ok({
    oracleEthAddress,
    AAOEndpoint,
    feePayerOverride,
    libs,
    sdk: audiusSdk,
    localEndpoint,
    dryRun
  })
}

export const condition = (_app: App<SharedData>): boolean => {
  // check on Fridays at 11am PST
  // TODO: pull this in from configuration
  const date = Date.parse("Fri 09:43:00 GMT-0600");
  const timeToDisburse = moment(date);
  const now = moment();
  if (now.isSame(timeToDisburse, "seconds")) return true;
  return false;
};
