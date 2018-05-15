pragma solidity ^0.4.18;

import "../token/ERC223/ERC223ReceivingContract.sol";

contract ERC223ReceivingContractImpl is ERC223ReceivingContract {
  event fallback(address indexed from, uint256 value, bytes data);
  function tokenFallback(address _from, uint256 _value, bytes _data) external {
    emit fallback(_from,_value,_data);
  }
}