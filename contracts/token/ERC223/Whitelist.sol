pragma solidity ^0.4.18;

import "../../ownership/Ownable.sol";

/**
 * @title Whitelist
 * A contract for Witelisting/Blacklisting addresses
 * By default all addresses are blacklisted.
 */

contract Whitelist is Ownable {
  
  mapping(address => bool) whitelist;

  event whitelisted(address indexed owner);
  event blacklisted(address indexed owner);
  
  /**
  * @dev Whitelist address
  * @param _addr The address to be whitelisted
  * @return An boolan if the whitelisting worked.
  */
  function whitelistAddress(address _addr) onlyOwner  public returns (bool) {
    whitelist[_addr] = true;
    emit whitelisted(_addr);
    return true; 
  }

  /**
  * @dev Blacklist address
  * @param _addr The address to be blacklisted
  * @return An boolan if the whitelisting worked.
  */
  function blacklistAddress(address _addr) onlyOwner  public returns (bool) {
    whitelist[_addr] = false;
    emit blacklisted(_addr);
    return true;
  }

  /**
  * @dev Checks if address is whitelisted
  * @param _addr The address to query the whitelist for.
  * @return An boolan if the address was found in the whitelist
  */
  function isWhitelisted(address _addr) public view returns (bool) {
    return whitelist[_addr];
  }

}
