"use strict";
/**
 * If `requestPromise` responds before `timeoutMs`, this function returns its response; else rejects with `timeoutErrorMsg`
 */
const racePromiseWithTimeout = async (requestPromise, timeoutMs, timeoutErrorMsg) => {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error(timeoutErrorMsg)), timeoutMs);
    });
    return Promise.race([requestPromise, timeoutPromise]);
};
module.exports = racePromiseWithTimeout;
