const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')

const UserStorage = artifacts.require('UserStorage')
const TrackStorage = artifacts.require('TrackStorage')
const DiscoveryProviderStorage = artifacts.require('DiscoveryProviderStorage')
const PlaylistStorage = artifacts.require('PlaylistStorage')
const SocialFeatureStorage = artifacts.require('SocialFeatureStorage')

const UserFactory = artifacts.require('UserFactory')
const TrackFactory = artifacts.require('TrackFactory')
const DiscoveryProviderFactory = artifacts.require('DiscoveryProviderFactory')
const SocialFeatureFactory = artifacts.require('SocialFeatureFactory')
const PlaylistFactory = artifacts.require('PlaylistFactory')
const UserLibraryFactory = artifacts.require('UserLibraryFactory')
const IPLDBlacklistFactory = artifacts.require('IPLDBlacklistFactory')

const userStorageKey = web3.utils.utf8ToHex('UserStorage')
const userFactoryKey = web3.utils.utf8ToHex('UserFactory')
const trackStorageKey = web3.utils.utf8ToHex('TrackStorage')
const trackFactoryKey = web3.utils.utf8ToHex('TrackFactory')
const discoveryProviderStorageKey = web3.utils.utf8ToHex('DiscoveryProviderStorage')
const discoveryProviderFactoryKey = web3.utils.utf8ToHex('DiscoveryProviderFactory')
const playlistStorageKey = web3.utils.utf8ToHex('PlaylistStorage')
const playlistFactoryKey = web3.utils.utf8ToHex('PlaylistFactory')
const socialFeatureFactoryKey = web3.utils.utf8ToHex('SocialFeatureFactory')
const socialFeatureStorageKey = web3.utils.utf8ToHex('SocialFeatureStorage')
const ipldBlacklistFactorykey = web3.utils.utf8ToHex('IPLDBlacklistFactory')
const userLibraryFactoryKey = web3.utils.utf8ToHex('UserLibraryFactory')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let registry = await Registry.deployed()

    const network_id = Registry.network_id
    const config = contractConfig[network]

    await deployer.deploy(UserStorage, Registry.address)
    await registry.addContract(userStorageKey, UserStorage.address)

    await deployer.deploy(TrackStorage, Registry.address)
    await registry.addContract(trackStorageKey, TrackStorage.address)

    const verifierAddress = config.verifierAddress || accounts[0]
    // this is the blacklist's veriferAddress
    const blacklisterAddress = config.blacklisterAddress || accounts[0]

    await deployer.deploy(UserFactory, Registry.address, userStorageKey, network_id, verifierAddress)
    await registry.addContract(userFactoryKey, UserFactory.address)

    await deployer.deploy(TrackFactory, Registry.address, trackStorageKey, userFactoryKey, network_id)
    await registry.addContract(trackFactoryKey, TrackFactory.address)

    await deployer.deploy(DiscoveryProviderStorage, Registry.address)
    await registry.addContract(discoveryProviderStorageKey, DiscoveryProviderStorage.address)

    await deployer.deploy(DiscoveryProviderFactory, Registry.address, discoveryProviderStorageKey)
    await registry.addContract(discoveryProviderFactoryKey, DiscoveryProviderFactory.address)

    await deployer.deploy(PlaylistStorage, Registry.address)
    await registry.addContract(playlistStorageKey, PlaylistStorage.address)
    await deployer.deploy(PlaylistFactory, Registry.address, playlistStorageKey, userFactoryKey, trackFactoryKey, network_id)
    await registry.addContract(playlistFactoryKey, PlaylistFactory.address)

    await deployer.deploy(SocialFeatureStorage, Registry.address)
    await registry.addContract(socialFeatureStorageKey, SocialFeatureStorage.address)
    await deployer.deploy(SocialFeatureFactory, Registry.address, socialFeatureStorageKey, userFactoryKey, trackFactoryKey, playlistFactoryKey, network_id)
    await registry.addContract(socialFeatureFactoryKey, SocialFeatureFactory.address)

    await deployer.deploy(UserLibraryFactory, Registry.address, userFactoryKey, trackFactoryKey, playlistFactoryKey, network_id)
    await registry.addContract(userLibraryFactoryKey, UserLibraryFactory.address)

    await deployer.deploy(IPLDBlacklistFactory, Registry.address, network_id, blacklisterAddress)
    await registry.addContract(ipldBlacklistFactorykey, IPLDBlacklistFactory.address)
  })
}
