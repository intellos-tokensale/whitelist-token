var Token = artifacts.require("./securityToken.sol");

module.exports = function(deployer) {
    deployer.deploy(Token);
};