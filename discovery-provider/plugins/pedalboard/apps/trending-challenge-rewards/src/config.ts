import App from "basekit/src/app";
import moment from "moment";

export type SharedData = {};

export const condition = (_app: App<SharedData>): boolean => {
  // check on Fridays at 11am PST
  const timeToDisburse = moment("Fri May 26 2023 08:22:30 GMT-0600");
  const now = moment();
  if (now.isSame(timeToDisburse, "seconds")) return true;
  return false;
};
