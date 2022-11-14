'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    ethers,
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const { sleep } = require('../../utils');
const DistributionExecutable = require('../../artifacts/examples/call-contract-with-token/DistributionExecutable.sol/DistributionExecutable.json');
const Gateway = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function deploy(chain, wallet) {
    console.log(`Deploying DistributionExecutable for ${chain.name}.`);
    const contract = await deployContract(wallet, DistributionExecutable, [chain.gateway, chain.gasReceiver]);
    chain.distributionExecutable = contract.address;
    console.log(`Deployed DistributionExecutable for ${chain.name} at ${chain.distributionExecutable}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;
    const account = args[3];
    const message = args[4];
    const payload = ethers.utils.defaultAbiCoder.encode(
        ["address","string"],
        [account, message]
    )
    if (account.length === 0) account = (wallet.address);

    for (const chain of [source, destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.distributionExecutable, DistributionExecutable.abi, chain.wallet);
        chain.gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const usdcAddress = chain.gateway.tokenAddresses('aUSDC');
        chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    }

    async function logAccountBalances() {
        console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
    }

    console.log('--- Initially ---');
    await logAccountBalances();

    const gasLimit = 3e6;
    const gasPrice = await getGasPrice(source, destination, AddressZero);

    const balance = BigInt(await destination.usdc.balanceOf(account));
    const prevReceiptCount = BigInt(await destination.contract.receiptCountMap(account));
    console.log(prevReceiptCount);
    console.log(BigInt(Math.floor(gasLimit * gasPrice)))
    const approveTx = await source.usdc.approve(source.contract.address, amount);
    await approveTx.wait();

    const sendTx = await source.contract.sendToMany(destination.name, destination.distributionExecutable, payload, 'aUSDC', amount, {
        //This Value is used for Gas, Extra gas will be refunded back. Ensure you have enough test tokens.
        value: BigInt(Math.floor(gasLimit * gasPrice)),
        //Needed to be added to remove UNPREDICTABLE_GAS_ERROR, can be reduced, this is the MAX Gas Limit allowed.
        gasLimit: 8000000
    });
    await sendTx.wait();
    let retry = 0;
    //Here we are waiting till the new transaction receipt is added, this can take ample time. Adjust retry attempts according to network traffic.
    while (BigInt(await destination.contract.receiptCountMap(account)) === prevReceiptCount && retry < 50) {
        await sleep(4000);
        retry = retry+1;
        console.log(retry);
    }

    const updatedReceiptCount = BigInt(await destination.contract.receiptCountMap(account));
    console.log((await destination.contract.addressReceiptMap(account, updatedReceiptCount-1n)));
    console.log('--- After ---');
    await logAccountBalances();
}

module.exports = {
    deploy,
    test,
};
