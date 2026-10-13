// Non-English legacy bip39 wordlists are stripped from the mobile bundle (see
// metro.config.js). bip39 requires each list inside a try/catch and skips the
// ones that fail to load.
throw new Error('Only the English BIP-39 wordlist is bundled on mobile')
