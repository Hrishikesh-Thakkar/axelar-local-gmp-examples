//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

/// @title Contract which can be used to send a receive messages across multiple chains.
contract DistributionExecutable is AxelarExecutable {
    IAxelarGasService public immutable gasReceiver;

    constructor(address gateway_, address gasReceiver_) AxelarExecutable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
    }

/// @notice How the Receipt will be generated
    struct TransactionReceipt {
        address recipient;
        address tokenAddress;
        string message;
        uint256 amount;
    }

/// @notice How we are storing the Reciepts, an address can have multiple receipts
    mapping (address => TransactionReceipt[]) public addressReceiptMap;
    mapping (address => uint) public receiptCountMap;
    
/// @notice Source Contract Calls this function to send the Transaction to the Axelar Gateway
/// @dev Ensure Enough Tokens are present when executing this function, extra gas is refunded.
/// @param destinationChain Destination Chain Name e.g Avalanche, Moonbeam, Ethereum
/// @param destinationAddress Destination Contract Address
/// @param payload Contains the Payload/Message to send to the Destination Chain
/// @param symbol e.g aUSDC
/// @param amount Number of tokens to be sent across in wei Unit
    function sendToMany(
        string memory destinationChain,
        string memory destinationAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gateway.tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }

/// @notice Axelar Gateway Invokes this function on the Destination Contract
/// @dev All Transaction Receipts are stored here
/// @param payload Contains the Payload/Message to send to the Destination Chain
/// @param tokenSymbol e.g aUSDC
/// @param amount Number of tokens to be sent across in wei Unit
    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (address recipientAddress, string memory messageSent) = abi.decode(payload,(address, string));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);
        TransactionReceipt memory txReceipt = TransactionReceipt(recipientAddress,tokenAddress,messageSent,amount);
        addressReceiptMap[recipientAddress].push(txReceipt);
        receiptCountMap[recipientAddress] = receiptCountMap[recipientAddress]+1;
    }
}
