pragma solidity ^0.4.18;


import "./token/ERC223/MintableToken.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract SecurityToken is MintableToken {

  string public constant name = "Security Token"; 
  string public constant symbol = "SEC"; 
  uint8 public constant decimals = 18; 

}
