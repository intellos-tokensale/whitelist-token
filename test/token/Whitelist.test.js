const assertRevert = require('../helpers/assertRevert');

const StandardTokenMock = artifacts.require('securityToken');

contract('securityToken', function([_, owner, recipient, anotherAccount]) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function() {
        const amount = 100;
        this.token = await StandardTokenMock.new({ from: owner });
        await this.token.whitelistAddress(owner, { from: owner });
        await this.token.whitelistAddress(anotherAccount, { from: owner });
        await this.token.whitelistAddress(recipient, { from: owner });
        await this.token.whitelistAddress(ZERO_ADDRESS, { from: owner });
        await this.token.mint(owner, amount, { from: owner });
    });


    describe('transfer from', function() {
        const spender = recipient;
        describe('when the recipient is whitelisted', function() {
            const to = anotherAccount;

            describe('when the spender has enough approved balance', function() {
                beforeEach(async function() {
                    await this.token.approve(spender, 100, { from: owner });
                });

                describe('when the owner has enough balance', function() {
                    const amount = 100;

                    it('transfers the requested amount', async function() {
                        await this.token.transferFrom(owner, to, amount, { from: spender });

                        const senderBalance = await this.token.balanceOf(owner);
                        assert.equal(senderBalance, 0);

                        const recipientBalance = await this.token.balanceOf(to);
                        assert.equal(recipientBalance, amount);
                    });

                    it('decreases the spender allowance', async function() {
                        await this.token.transferFrom(owner, to, amount, { from: spender });

                        const allowance = await this.token.allowance(owner, spender);
                        assert(allowance.eq(0));
                    });

                    it('emits a transfer event', async function() {
                        const { logs } = await this.token.transferFrom(owner, to, amount, { from: spender });

                        assert.equal(logs.length, 1);
                        assert.equal(logs[0].event, 'Transfer');
                        assert.equal(logs[0].args.from, owner);
                        assert.equal(logs[0].args.to, to);
                        assert(logs[0].args.value.eq(amount));
                    });
                });

                describe('when the owner does not have enough balance', function() {
                    const amount = 101;

                    it('reverts', async function() {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });
        });

        describe('when the recipient is blacklisted', function() {
            const to = anotherAccount;

            describe('when the spender has enough approved balance', function() {
                beforeEach(async function() {
                    await this.token.approve(spender, 100, { from: owner });
                    await this.token.blacklistAddress(to, { from: owner });
                });

                describe('when the owner has enough balance', function() {
                    const amount = 100;

                    it('transfers the requested amount', async function() {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });

                });
            });
        });

    });

    describe('transfer', function() {

        describe('when the recipient is whitelisted', function() {
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


                it('transfers the requested amount to an address with data', async function() {

                    const data = '0x0';
                    const TrxID = await this.token.contract.transfer['address,uint256,bytes'].sendTransaction(to, amount, data, { from: owner });
                    //const { logs } = await this.token.contract.transfer['address,uint256,bytes'].request(to, amount, data, { from: anotherAccount });
                    assert(TrxID, 'transaction failed');

                });

            });
        });
    });
    describe('when the recipient is blacklisted', function() {
        const to = recipient;

        describe('when the sender has enough balance', function() {
            const amount = 100;
            const from = owner;


            beforeEach(async function() {

                await this.token.mint(anotherAccount, amount, { from });
                await this.token.blacklistAddress(recipient, { from });
                const balance = await this.token.balanceOf(anotherAccount);
            });


            it('does not transfer the requested amount', async function() {

                await assertRevert(this.token.transfer(to, amount, { from: from }));
            });

            it(' does not transfer the requested amount to an address with data', async function() {

                const data = '0x0';
                try {
                    const TrxID = this.token.contract.transfer['address,uint256,bytes'].sendTransaction(recipient, amount, data, { from: owner });
                } catch (error) {
                    const revertFound = error.message.search('revert') >= 0;
                    assert(revertFound, `Expected "revert", got ${error} instead`);
                }
            });


        });
    });
});