const assertRevert = require('../helpers/assertRevert');
const MintableToken = artifacts.require('securityToken');
const ERC223ReceivingContractImpl = artifacts.require('ERC223ReceivingContractImpl.sol');
const evmThrewRevertError = require('../helpers/vmerror.js');

contract('securityToken', function([owner, anotherAccount, recipient]) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function() {
        this.receiverContract = await ERC223ReceivingContractImpl.new();
        this.token = await MintableToken.new({ from: owner });
        let i = await this.token.whitelistAddress(owner);
        i = await this.token.whitelistAddress(anotherAccount);
        i = await this.token.whitelistAddress(recipient);
        i = await this.token.whitelistAddress(this.receiverContract.address);
    });


    describe('minting finished', function() {
        describe('when the token is not finished', function() {
            it('returns false', async function() {
                const mintingFinished = await this.token.mintingFinished();
                assert.equal(mintingFinished, false);
            });
        });

        describe('when the token is finished', function() {
            beforeEach(async function() {
                await this.token.finishMinting({ from: owner });
            });

            it('returns true', async function() {
                const mintingFinished = await this.token.mintingFinished.call();
                assert.equal(mintingFinished, true);
            });
        });
    });

    describe('finish minting', function() {
        describe('when the sender is the token owner', function() {
            const from = owner;

            describe('when the token was not finished', function() {
                it('finishes token minting', async function() {
                    await this.token.finishMinting({ from });

                    const mintingFinished = await this.token.mintingFinished();
                    assert.equal(mintingFinished, true);
                });

                it('emits a mint finished event', async function() {
                    const { logs } = await this.token.finishMinting({ from });

                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'MintFinished');
                });
            });

            describe('when the token was already finished', function() {
                beforeEach(async function() {
                    await this.token.finishMinting({ from });
                });

                it('reverts', async function() {
                    await assertRevert(this.token.finishMinting({ from }));
                });
            });

        });

        describe('when the sender is not the token owner', function() {
            const from = anotherAccount;

            describe('when the token was not finished', function() {
                it('reverts', async function() {
                    await assertRevert(this.token.finishMinting({ from }));
                });
            });

            describe('when the token was already finished', function() {
                beforeEach(async function() {
                    await this.token.finishMinting({ from: owner });
                });

                it('reverts', async function() {
                    await assertRevert(this.token.finishMinting({ from }));
                });
            });
        });
    });

    describe('mint', function() {
        const amount = 100;

        describe('when the sender is the token owner', function() {
            const from = owner;

            describe('when the token was not finished', function() {
                it('mints the requested amount', async function() {
                    await this.token.mint(owner, amount, { from });

                    const balance = await this.token.balanceOf(owner);
                    assert.equal(balance, amount);
                });

                it('emits a mint finished event', async function() {
                    const { logs } = await this.token.mint(owner, amount, { from });

                    assert.equal(logs.length, 2);
                    assert.equal(logs[0].event, 'Mint');
                    assert.equal(logs[0].args.to, owner);
                    assert.equal(logs[0].args.amount, amount);
                    assert.equal(logs[1].event, 'Transfer');
                });

                it('mints the requested amount for another account', async function() {
                    await this.token.mint(anotherAccount, amount, { from });

                    const balance = await this.token.balanceOf(anotherAccount);
                    assert.equal(balance, amount);
                });

                it('returns the correct total amount of tokens when none are minted', async function() {
                    const totalSupply = await this.token.totalSupply();
                    assert.equal(totalSupply, 0);
                });

                it('returns the correct total amount of tokens when two are minted', async function() {
                    await this.token.mint(owner, amount, { from });
                    await this.token.mint(anotherAccount, amount, { from });
                    const totalSupply = await this.token.totalSupply();
                    assert.equal(totalSupply, 200);
                });
            });

            describe('when the token minting is finished', function() {
                beforeEach(async function() {
                    await this.token.finishMinting({ from });
                });

                it('reverts', async function() {
                    await assertRevert(this.token.mint(owner, amount, { from }));
                });
            });


        });

        describe('when the sender is not the token owner', function() {
            const from = anotherAccount;
            describe('when the token was not finished', function() {
                it('reverts', async function() {
                    await assertRevert(this.token.mint(owner, amount, { from }));
                });

            });

            describe('when the token was already finished', function() {
                beforeEach(async function() {
                    await this.token.finishMinting({ from: owner });
                });

                it('reverts', async function() {
                    await assertRevert(this.token.mint(owner, amount, { from }));
                });
            });


        });
    });

    describe('transfer', function() {

        describe('when the recipient is not the zero address', function() {
            const to = recipient;
            describe('when the sender does not have enough balance', function() {
                const amount = 101;

                it('reverts', async function() {
                    await assertRevert(this.token.transfer(to, amount, { from: anotherAccount }));
                });
            });

            describe('when the sender has enough balance', function() {
                const amount = 100;
                const from = owner;


                beforeEach(async function() {

                    await this.token.mint(anotherAccount, amount, { from });
                    const balance = await this.token.balanceOf(anotherAccount);
                });


                it('transfers the requested amount', async function() {

                    await this.token.transfer(to, amount, { from: anotherAccount });

                    const senderBalance = await this.token.balanceOf(anotherAccount);
                    assert.equal(senderBalance, 0);

                    const recipientBalance = await this.token.balanceOf(to);
                    assert.equal(recipientBalance, amount);
                });

                it('emits a transfer event', async function() {
                    const { logs } = await this.token.transfer(to, amount, { from: anotherAccount });
                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Transfer');
                    assert.equal(logs[0].args.from, anotherAccount);
                    assert.equal(logs[0].args.to, to);
                    assert(logs[0].args.value.eq(amount));
                });

                it('transfers the requested amount to a valid contract', async function() {
                    const to = this.receiverContract.address;
                    const data = '0x0';
                    const TrxID = await this.token.contract.transfer['address,uint256,bytes'].sendTransaction(to, amount, data, { from: anotherAccount });
                    //const { logs } = await this.token.contract.transfer['address,uint256,bytes'].request(to, amount, data, { from: anotherAccount });
                    assert(TrxID, 'transaction failed');
                });

                it('transfers the requested amount to an invalid contract without data', async function() {

                    this.token.transfer(this.token.address, amount, { from: anotherAccount })
                        .catch((err) => {

                            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not throw the expected error')
                        });

                });


                it('transfers the requested amount to an invalid contract with data', async function() {

                    const to = this.token.address;
                    const data = '0x0';
                    try {
                        TrxID = await this.token.contract.transfer['address,uint256,bytes'].sendTransaction(to, amount, data, { from: anotherAccount });
                        assert(false);
                    } catch (err) {

                        assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not throw the expected error')
                    }

                });

                it('transfers the requested amount to an address with data', async function() {

                    const data = '0x0';
                    const TrxID = await this.token.contract.transfer['address,uint256,bytes'].sendTransaction(to, amount, data, { from: anotherAccount });

                    assert(TrxID, 'transaction failed');

                });

            });
        });

        describe('when the recipient is the zero address', function() {
            const to = ZERO_ADDRESS;

            it('reverts', async function() {
                await assertRevert(this.token.transfer(to, 100, { from: owner }));
            });
        });
    });
});