var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
import { audiusBackend } from '@audius/common/services';
import * as nativeLibs from '@audius/sdk/dist/native-libs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { env } from 'app/env';
import { track } from 'app/services/analytics';
import { reportToSentry } from 'app/utils/reportToSentry';
import { createPrivateKey } from './createPrivateKey';
import { withEagerOption } from './eagerLoadUtils';
import { libsInitEventEmitter, LIBS_INITTED_EVENT, setLibs, waitForLibsInit } from './libs';
import { monitoringCallbacks } from './monitoringCallbacks';
import { getFeatureEnabled } from './remote-config';
import { remoteConfigInstance } from './remote-config/remote-config-instance';
import { discoveryNodeSelectorService } from './sdk/discoveryNodeSelector';
import { getStorageNodeSelector } from './sdk/storageNodeSelector';
/**
 * audiusBackend initialized for a mobile environment
 */
export var audiusBackendInstance = audiusBackend({
    claimDistributionContractAddress: (_a = env.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS) !== null && _a !== void 0 ? _a : undefined,
    env: env,
    ethOwnerWallet: (_b = env.ETH_OWNER_WALLET) !== null && _b !== void 0 ? _b : undefined,
    ethProviderUrls: (env.ETH_PROVIDER_URL || '').split(','),
    ethRegistryAddress: env.ETH_REGISTRY_ADDRESS,
    ethTokenAddress: env.ETH_TOKEN_ADDRESS,
    discoveryNodeSelectorService: discoveryNodeSelectorService,
    getFeatureEnabled: getFeatureEnabled,
    getHostUrl: function () {
        return "".concat(env.PUBLIC_PROTOCOL, "//").concat(env.PUBLIC_HOSTNAME);
    },
    getStorageNodeSelector: getStorageNodeSelector,
    getWeb3Config: function (libs, registryAddress, entityManagerAddress, web3ProviderUrls) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, ({
                    error: false,
                    web3Config: libs.configInternalWeb3(registryAddress, web3ProviderUrls, undefined, entityManagerAddress)
                })];
        });
    }); },
    hedgehogConfig: {
        createKey: createPrivateKey
    },
    identityServiceUrl: env.IDENTITY_SERVICE,
    generalAdmissionUrl: env.GENERAL_ADMISSION,
    isElectron: false,
    localStorage: AsyncStorage,
    monitoringCallbacks: monitoringCallbacks,
    nativeMobile: true,
    onLibsInit: function (libs) {
        setLibs(libs);
        libsInitEventEmitter.emit(LIBS_INITTED_EVENT);
    },
    recaptchaSiteKey: env.RECAPTCHA_SITE_KEY,
    recordAnalytics: track,
    reportError: reportToSentry,
    registryAddress: env.REGISTRY_ADDRESS,
    entityManagerAddress: env.ENTITY_MANAGER_ADDRESS,
    remoteConfigInstance: remoteConfigInstance,
    setLocalStorageItem: function (key, value) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, AsyncStorage.setItem(key, value)];
    }); }); },
    solanaConfig: {
        claimableTokenPda: env.CLAIMABLE_TOKEN_PDA,
        claimableTokenProgramAddress: env.CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
        rewardsManagerProgramId: env.REWARDS_MANAGER_PROGRAM_ID,
        rewardsManagerProgramPda: env.REWARDS_MANAGER_PROGRAM_PDA,
        rewardsManagerTokenPda: env.REWARDS_MANAGER_TOKEN_PDA,
        paymentRouterProgramId: env.PAYMENT_ROUTER_PROGRAM_ID,
        solanaClusterEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
        solanaFeePayerAddress: env.SOLANA_FEE_PAYER_ADDRESS,
        solanaTokenAddress: env.SOLANA_TOKEN_PROGRAM_ADDRESS,
        waudioMintAddress: env.WAUDIO_MINT_ADDRESS,
        usdcMintAddress: env.USDC_MINT_ADDRESS,
        wormholeAddress: (_c = env.WORMHOLE_ADDRESS) !== null && _c !== void 0 ? _c : undefined
    },
    userNodeUrl: env.USER_NODE,
    web3NetworkId: env.WEB3_NETWORK_ID,
    web3ProviderUrls: (env.WEB3_PROVIDER_URL || '').split(','),
    waitForWeb3: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    wormholeConfig: {
        ethBridgeAddress: (_d = env.ETH_BRIDGE_ADDRESS) !== null && _d !== void 0 ? _d : undefined,
        ethTokenBridgeAddress: (_e = env.ETH_TOKEN_BRIDGE_ADDRESS) !== null && _e !== void 0 ? _e : undefined,
        solBridgeAddress: (_f = env.SOL_BRIDGE_ADDRESS) !== null && _f !== void 0 ? _f : undefined,
        solTokenBridgeAddress: (_g = env.SOL_TOKEN_BRIDGE_ADDRESS) !== null && _g !== void 0 ? _g : undefined,
        wormholeRpcHosts: (_h = env.WORMHOLE_RPC_HOSTS) !== null && _h !== void 0 ? _h : undefined
    },
    getLibs: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, nativeLibs];
    }); }); },
    waitForLibsInit: waitForLibsInit,
    withEagerOption: withEagerOption,
    imagePreloader: function (url) { return Image.prefetch(url); }
});
