pragma solidity ^0.4.18;

import "./ERC223Basic.sol";
import "./ERC223.sol";


/**
 * @title SafeERC223
 * @dev Wrappers around ERC223 operations that throw on failure.
 * To use this library you can add a `using SafeERC223 for ERC223;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC223 {
  function safeTransfer(ERC223Basic token, address to, uint256 value) internal {
    assert(token.transfer(to, value));
  }

  function safeTransferFrom(ERC223 token, address from, address to, uint256 value) internal {
    assert(token.transferFrom(from, to, value));
  }

  function safeApprove(ERC223 token, address spender, uint256 value) internal {
    assert(token.approve(spender, value));
  }
}
