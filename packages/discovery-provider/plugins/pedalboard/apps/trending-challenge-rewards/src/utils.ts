import { initializeDiscoveryDb, initializeIdentityDb } from "@pedalboard/basekit";
import { Err, Ok, Result } from "ts-results";

export const identityDb = initializeIdentityDb()
export const discoveryDb = initializeDiscoveryDb()

/// catches possibles errors and converts them to an appropriate result type
/// this is useful when using a library that may throw and you want to catch it safely
export const intoResult = async <T>(
  func: () => Promise<T>
): Promise<Result<T, string>> => {
  try {
    return new Ok(await func());
  } catch (e: any) {
    return new Err(`${e}`);
  }
};
