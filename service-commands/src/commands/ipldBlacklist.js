const addIPLDToBlacklist = async (libsWrapper, digest, blacklisterAddressPrivateKey = null) => {
    const ipldTxReceipt = await libsWrapper.addIPLDToBlacklist(digest, blacklisterAddressPrivateKey)
    return ipldTxReceipt
}

module.exports = { addIPLDToBlacklist }