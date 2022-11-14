# Axelar Cross-Chain Example Walkthrough
Developed a Basic Messaging Application which transfer aUSDC from one chain to another and stores the transaction receipt on chain.
Referenced this [Tutorial Series](https://www.youtube.com/watch?v=PWXmsP_a-ck&list=PLh_q0hSKS_y23UECn5GJML0BDhJDDiiiL&index=19&ab_channel=Axelar) from the Axelar Official YouTube Channel.

## Setup Of The Project
1. Clone the Project Using the Following Link:
```
git clone https://github.com/axelarnetwork/axelar-local-gmp-examples.git
```
2. Check the Node Version using node -v if it is not Version 16 then run the below lines:
```
sudo npm i -g n
sudo n v16.15.0
```
3. Build contracts and tests:
```
npm ci
npm run build
```
4. Set Up Deployer Key And Insert the [EVM Private Key From MetaMask](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key#:~:text=On%20the%20account%20page%2C%20click,click%20%E2%80%9CConfirm%E2%80%9D%20to%20proceed.).
```
cp .env.example .env
```
5. To Set up the Local Environment for Local Testing, Run this in a separate terminal window
```
node scripts/createLocal
```
6. Go To info/testnet.json and replace the Ethereum Ropsten Infura RPC URL with Goerli RPC URL. Can be done on [Infura](https://app.infura.io/dashboard)
7. Go to node_modules/@axelar-network/axelar-local-dev/info/testnet.json and remove Binance and replace the Ethereum Ropsten Infura RPC URL. Goerli RPC URL
8. Then join the Discord For [Axelar Network](https://discord.com/invite/aRZ3Ra6f7D).
9. Once there get Verified and Fetch Tokens from the Faucet Channel (Returns aUSDC based on the chain we require).
10. Then go to each of the testnet Faucets and get the Native Tokens. (We need a good amount of tokens, a lot of them are needed)
11. Then run the Deploy Script
``` 
node scripts/deploy examples/call-contract [local | testnet] (use either testnet or local depending on where you are at testing)
```
12. Now we can run the test function
```
node scripts/test examples/call-contract-with-token testnet "Moonbeam" "Avalanche" 1 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb "Hello Axelar Network"
```
Here we are sending 1 aUSDC from our Moonbeam Wallet to the following Avalanche address 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb. Along with the message "Hello Axelar Network". This can be the transaction description as well.

13. Once the transaction is executed we should be able to view them on [Axelar Network Testnet](https://testnet.axelarscan.io/gmp/0xd8894ed1e7f6d76701a3da2b81285d852e7810fd8dec0efd97d5a3c9ea1ea39c:12) as well as the [Source](https://moonbase.moonscan.io/tx/0xd8894ed1e7f6d76701a3da2b81285d852e7810fd8dec0efd97d5a3c9ea1ea39c) and [Destination](https://testnet.avascan.info/blockchain/c/tx/0x089212d614bf64ba028a1023bf5a06ac22046e42da15c4065f720176c22f7d23) Chains Testnets.
Sample Response After Running the Test should be something similar as shown below.
```
[
  '0xBa86A5719722B02a5D5e388999C25f3333c7A9fb',
  '0x57F1c63497AEe0bE305B8852b354CEc793da43bB',
  'Hello Axelar Network',
  BigNumber { _hex: '0x0f4240', _isBigNumber: true },
  recipient: '0xBa86A5719722B02a5D5e388999C25f3333c7A9fb',
  tokenAddress: '0x57F1c63497AEe0bE305B8852b354CEc793da43bB',
  message: 'Hello Axelar Network',
  amount: BigNumber { _hex: '0x0f4240', _isBigNumber: true }
]
```

## Approach To The Smart Contract
In the DistributionExecutable.sol Contract I have modified the logic to store Transaction Receipts.
```
 struct TransactionReceipt {
        address recipient;
        address tokenAddress;
        string message;
        uint256 amount;
    }
mapping (address => TransactionReceipt[]) public addressReceiptMap;
```
This above is the structure of the a Receipt. And then I kept a map which tracks all the reciepts for a given address on that chain. Eventually we can add a claim function which would allow that user to claim these tokens in bulk from the Smart Contract.

## Challenges
1. Faced some difficulty in understanding how to run the example projects provided. I had to make modifications for GasLimit and config changes in other node modules.
2. Faced some issue getting aUSDC from the Faucet. Didn't know it was on Discord.
3. There was a Network Issue I was facing since Ethereum RPC Infura URL was pointing to Ropsten not Goerli, had to make that change.
4. Struggled a lot with CALL_EXCEPTIONS from running the test script. Turns out the I didn't have enough test tokens.

## Positive Outcomes
1. The project is trying to solve a very challenging problem and the examples are a great way to learn how things are working under the hood.
2. Documentation and Videos are very well done. Some points may need to be updated.
3. Was able to successfully see how cross chain messaging could work and the scope of it.