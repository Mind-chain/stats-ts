import axios from 'axios';
import { ethers } from 'ethers';
import  { Level } from 'level';
import express, { Request, Response } from 'express';
import WebSocket from 'ws';
import { validator_abi } from '../abi/validator';
import { erc20_abi } from '../abi/erc20';
import { contracts, ws_rpc, blockcounterapi } from '../const';
import { cns_abi } from '../abi/cns_abi';

const app = express();
const port: number = 8000;

const st_provider: ethers.WebSocketProvider = new ethers.WebSocketProvider(ws_rpc);

const validatorContract: ethers.Contract = new ethers.Contract(contracts.validator, validator_abi, st_provider);
const rewardTokenContract: ethers.Contract = new ethers.Contract(contracts.Pmind, erc20_abi, st_provider);

const db: Level = new Level("./data") // Initialize LevelDB database

// Cache for storing validator data
const validatorCache: Map<string, any> = new Map();

// Function to fetch validator data and update cache
async function fetchAndUpdateValidatorData(validator: string): Promise<any> {
    try {
        const [stake, rewards, statusData] = await Promise.all([
            validatorContract.accountStake(validator),
            rewardTokenContract.balanceOf(validator),
            axios.get(`${blockcounterapi}${validator}`)
        ]);

        const validatedBlocksStatus: string = statusData.data.has_validated_blocks ? "active" : "inactive";

        // Fetch the human-readable name from the database
        const name: string | null = await db.get(validator).catch(() => null);

        // Fetch the number of produced blocks
        const producedBlocksCount: number = statusData.data.produced_blocks_count || 0;

        // Prepare data for storage
        const data = {
            address: validator,
            name: name || '',
            stake: ethers.formatEther(stake) + " MIND",
            rewards: ethers.formatEther(rewards) + " PMIND",
            validatedBlocksCount: producedBlocksCount,
            validatedBlocksStatus: validatedBlocksStatus,
        };

        // Store data in cache
        validatorCache.set(validator, data);

        return data;
    } catch (error) {
        console.error('Error fetching validator data:', error);
        throw error;
    }
}


// Function to fetch validators data in parallel
async function fetchValidatorsData(validators: string[]): Promise<any[]> {
    try {
        const validatorData: any[] = await Promise.all(validators.map(fetchAndUpdateValidatorData));
        return validatorData;
    } catch (error) {
        console.error('Error fetching validators:', error);
        throw error;
    }
}

// Update the cache with validator data
async function updateValidatorCache(validators: string[]): Promise<void> {
    try {
        const validatorData: any[] = await fetchValidatorsData(validators);
        validatorData.forEach(data => {
            validatorCache.set(data.address, data);
        });
    } catch (error) {
        console.error('Error updating validator cache:', error);
        throw error;
    }
}

// Listen for new blocks and update validator data and cache
st_provider.on('block', async (blockNumber: number) => {
    try {
        console.log(`New block received: ${blockNumber}, updating data and cache...`);
        const validators: string[] = await validatorContract.validators();
        await updateValidatorCache(validators);
    } catch (error) {
        console.error('Error updating validator data and cache:', error);
    }
});

// Function for initial fetch and store, including updating the cache
async function initialFetchAndStore(): Promise<void> {
    try {
        console.log('Initial fetch and store...');
        const validators: string[] = await validatorContract.validators();
        await updateValidatorCache(validators);
    } catch (error) {
        console.error('Error fetching and storing initial validator data:', error);
    }
}
initialFetchAndStore();

// Allow any origin to access the API
app.use((req: Request, res: Response, next: Function) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware to parse JSON data in the request body
app.use(express.json());

// API endpoint to add human-readable names for addresses
app.post('/addName', async (req: Request, res: Response) => {
    try {
        const { address, name } = req.body;

        // Check if the name already exists for the address
        const existingName: string | null = await db.get(address).catch(() => null);
        if (existingName) {
            return res.status(400).json({ error: 'Name already exists for this address' });
        }

        // If the name doesn't exist, add it to the database
        await db.put(address, name);
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding name for address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to fetch validator data
app.get('/validators', async (req: Request, res: Response) => {
    try {
        console.log('Received HTTP request for validator data.');
        const validatorData: any[] = Array.from(validatorCache.values()).map(validator => {
            const { address, name, stake, rewards, validatedBlocksCount, validatedBlocksStatus } = validator;
            return { address, name, stake, rewards, validatedBlocksCount, validatedBlocksStatus };
        }).reverse();
        res.json(validatorData);
    } catch (error) {
        console.error('Error fetching validator data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to fetch total staked amount directly from the contract
async function fetchTotalStakedAmount(): Promise<string> {
    try {
        const totalStakedAmount: ethers.BigNumberish = await validatorContract.stakedAmount();
        return ethers.formatEther(totalStakedAmount) + " MIND";
    } catch (error) {
        console.error('Error fetching total staked amount:', error);
        throw error;
    }
}

// Contract instance for BlockchainInfo
const blockchainInfoContract: ethers.Contract = new ethers.Contract(contracts.blockchainInfoAddress, cns_abi, st_provider);

// Function to fetch current block epoch from BlockchainInfo contract
async function fetchCurrentBlockEpoch(): Promise<string> {
    try {
        const currentBlockEpoch: string = await blockchainInfoContract.getCurrentBlockEpoch();
        return parseInt(currentBlockEpoch, 16).toString();
    } catch (error) {
        console.error('Error fetching current block epoch:', error);
        throw error;
    }
}

// Function to count total validator addresses from LevelDB
async function countTotalValidatorAddresses(): Promise<number> {
    try {
        const totalAddresses: number = validatorCache.size;
        console.log('Total validator addresses counted:', totalAddresses);
        return totalAddresses;
    } catch (error) {
        console.error('Error counting total validator addresses:', error);
        throw error;
    }
}

// API endpoint to fetch chain data
app.get('/chaindata', async (req: Request, res: Response) => {
    try {
        console.log('Received HTTP request for chain data.');
        const currentBlockEpoch: string = await fetchCurrentBlockEpoch();
        const totalStakedAmount: string = await fetchTotalStakedAmount();
        const totalValidatorAddresses: number = await countTotalValidatorAddresses();
        res.json({ currentBlockEpoch, totalStakedAmount, totalValidatorAddresses });
    } catch (error) {
        console.error('Error fetching chain data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
