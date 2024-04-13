const contracts: { [key: string]: string } = {
    validator: "0x0000000000000000000000000000000000001001",
    Pmind: "0x75E218790B76654A5EdA1D0797B46cBC709136b0",
    blockchainInfoAddress: "0xa35fe650cC2A4F2024A73bA7f76bF7FBad64101F"
};

const ws_rpc: string = "ws://91.208.92.6:8545/ws";
const http_rpc: string = "http://91.208.92.6:8545";
const blockcounterapi: string = "http://91.208.92.77:3000/api/v2/addresses/";

export {
    contracts,
    ws_rpc,
    http_rpc,
    blockcounterapi
};
