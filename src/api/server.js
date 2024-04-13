"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var ethers_1 = require("ethers");
var level_1 = require("level");
var express_1 = require("express");
var validator_1 = require("../abi/validator");
var erc20_1 = require("../abi/erc20");
var const_1 = require("../const");
var cns_abi_1 = require("../abi/cns_abi");
var app = (0, express_1.default)();
var port = 8000;
var st_provider = new ethers_1.ethers.WebSocketProvider(const_1.ws_rpc);
var validatorContract = new ethers_1.ethers.Contract(const_1.contracts.validator, validator_1.validator_abi, st_provider);
var rewardTokenContract = new ethers_1.ethers.Contract(const_1.contracts.Pmind, erc20_1.erc20_abi, st_provider);
var db = new level_1.Level("./data"); // Initialize LevelDB database
// Cache for storing validator data
var validatorCache = new Map();
// Function to fetch validator data and update cache
function fetchAndUpdateValidatorData(validator) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, stake, rewards, statusData, validatedBlocksStatus, name_1, producedBlocksCount, data, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            validatorContract.accountStake(validator),
                            rewardTokenContract.balanceOf(validator),
                            axios_1.default.get("".concat(const_1.blockcounterapi).concat(validator))
                        ])];
                case 1:
                    _a = _b.sent(), stake = _a[0], rewards = _a[1], statusData = _a[2];
                    validatedBlocksStatus = statusData.data.has_validated_blocks ? "active" : "inactive";
                    return [4 /*yield*/, db.get(validator).catch(function () { return null; })];
                case 2:
                    name_1 = _b.sent();
                    producedBlocksCount = statusData.data.produced_blocks_count || 0;
                    data = {
                        address: validator,
                        name: name_1 || '',
                        stake: ethers_1.ethers.formatEther(stake) + " MIND",
                        rewards: ethers_1.ethers.formatEther(rewards) + " PMIND",
                        validatedBlocksCount: producedBlocksCount,
                        validatedBlocksStatus: validatedBlocksStatus,
                    };
                    // Store data in cache
                    validatorCache.set(validator, data);
                    return [2 /*return*/, data];
                case 3:
                    error_1 = _b.sent();
                    console.error('Error fetching validator data:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Function to fetch validators data in parallel
function fetchValidatorsData(validators) {
    return __awaiter(this, void 0, void 0, function () {
        var validatorData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all(validators.map(fetchAndUpdateValidatorData))];
                case 1:
                    validatorData = _a.sent();
                    return [2 /*return*/, validatorData];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error fetching validators:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Update the cache with validator data
function updateValidatorCache(validators) {
    return __awaiter(this, void 0, void 0, function () {
        var validatorData, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetchValidatorsData(validators)];
                case 1:
                    validatorData = _a.sent();
                    validatorData.forEach(function (data) {
                        validatorCache.set(data.address, data);
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error updating validator cache:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Listen for new blocks and update validator data and cache
st_provider.on('block', function (blockNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var validators, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.log("New block received: ".concat(blockNumber, ", updating data and cache..."));
                return [4 /*yield*/, validatorContract.validators()];
            case 1:
                validators = _a.sent();
                return [4 /*yield*/, updateValidatorCache(validators)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error('Error updating validator data and cache:', error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Function for initial fetch and store, including updating the cache
function initialFetchAndStore() {
    return __awaiter(this, void 0, void 0, function () {
        var validators, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log('Initial fetch and store...');
                    return [4 /*yield*/, validatorContract.validators()];
                case 1:
                    validators = _a.sent();
                    return [4 /*yield*/, updateValidatorCache(validators)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    console.error('Error fetching and storing initial validator data:', error_5);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
initialFetchAndStore();
// Allow any origin to access the API
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
// Middleware to parse JSON data in the request body
app.use(express_1.default.json());
// API endpoint to add human-readable names for addresses
app.post('/addName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, address, name_2, existingName, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, address = _a.address, name_2 = _a.name;
                return [4 /*yield*/, db.get(address).catch(function () { return null; })];
            case 1:
                existingName = _b.sent();
                if (existingName) {
                    return [2 /*return*/, res.status(400).json({ error: 'Name already exists for this address' })];
                }
                // If the name doesn't exist, add it to the database
                return [4 /*yield*/, db.put(address, name_2)];
            case 2:
                // If the name doesn't exist, add it to the database
                _b.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                console.error('Error adding name for address:', error_6);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// API endpoint to fetch validator data
app.get('/validators', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validatorData;
    return __generator(this, function (_a) {
        try {
            console.log('Received HTTP request for validator data.');
            validatorData = Array.from(validatorCache.values()).map(function (validator) {
                var address = validator.address, name = validator.name, stake = validator.stake, rewards = validator.rewards, validatedBlocksCount = validator.validatedBlocksCount, validatedBlocksStatus = validator.validatedBlocksStatus;
                return { address: address, name: name, stake: stake, rewards: rewards, validatedBlocksCount: validatedBlocksCount, validatedBlocksStatus: validatedBlocksStatus };
            }).reverse();
            res.json(validatorData);
        }
        catch (error) {
            console.error('Error fetching validator data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// Function to fetch total staked amount directly from the contract
function fetchTotalStakedAmount() {
    return __awaiter(this, void 0, void 0, function () {
        var totalStakedAmount, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, validatorContract.stakedAmount()];
                case 1:
                    totalStakedAmount = _a.sent();
                    return [2 /*return*/, ethers_1.ethers.formatEther(totalStakedAmount) + " MIND"];
                case 2:
                    error_7 = _a.sent();
                    console.error('Error fetching total staked amount:', error_7);
                    throw error_7;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Contract instance for BlockchainInfo
var blockchainInfoContract = new ethers_1.ethers.Contract(const_1.contracts.blockchainInfoAddress, cns_abi_1.cns_abi, st_provider);
// Function to fetch current block epoch from BlockchainInfo contract
function fetchCurrentBlockEpoch() {
    return __awaiter(this, void 0, void 0, function () {
        var currentBlockEpoch, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, blockchainInfoContract.getCurrentBlockEpoch()];
                case 1:
                    currentBlockEpoch = _a.sent();
                    return [2 /*return*/, parseInt(currentBlockEpoch, 16).toString()];
                case 2:
                    error_8 = _a.sent();
                    console.error('Error fetching current block epoch:', error_8);
                    throw error_8;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Function to count total validator addresses from LevelDB
function countTotalValidatorAddresses() {
    return __awaiter(this, void 0, void 0, function () {
        var totalAddresses;
        return __generator(this, function (_a) {
            try {
                totalAddresses = validatorCache.size;
                console.log('Total validator addresses counted:', totalAddresses);
                return [2 /*return*/, totalAddresses];
            }
            catch (error) {
                console.error('Error counting total validator addresses:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
// API endpoint to fetch chain data
app.get('/chaindata', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var currentBlockEpoch, totalStakedAmount, totalValidatorAddresses, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                console.log('Received HTTP request for chain data.');
                return [4 /*yield*/, fetchCurrentBlockEpoch()];
            case 1:
                currentBlockEpoch = _a.sent();
                return [4 /*yield*/, fetchTotalStakedAmount()];
            case 2:
                totalStakedAmount = _a.sent();
                return [4 /*yield*/, countTotalValidatorAddresses()];
            case 3:
                totalValidatorAddresses = _a.sent();
                res.json({ currentBlockEpoch: currentBlockEpoch, totalStakedAmount: totalStakedAmount, totalValidatorAddresses: totalValidatorAddresses });
                return [3 /*break*/, 5];
            case 4:
                error_9 = _a.sent();
                console.error('Error fetching chain data:', error_9);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Start server
app.listen(port, function () {
    console.log("Server running at http://localhost:".concat(port));
});
