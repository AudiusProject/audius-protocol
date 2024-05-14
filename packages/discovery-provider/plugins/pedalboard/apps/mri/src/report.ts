import { Knex } from "knex";
import { logger as plogger } from "./logger";

export const reportMRIData = async (db: Knex, date: Date) => {
    const logger = plogger.child({ date: date.toISOString() })
    logger.info("beginning report processing")
}
