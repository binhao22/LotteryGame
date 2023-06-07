const Lottery = artifacts.require("Lottery");
const assertRevert = require('./assertRevert');
const expectEvent = require('./expectEvent');

contract('Lottery', function([deployer, user1, user2]) {    // ganache-cli 10개 지갑주소
    let lottery;
    let betAmount = 5 * 10 ** 15;
    let betAmountBN = new web3.utils.BN('5000000000000000');    // 빅넘버 라이브러리
    let bet_block_interval = 3;

    // 테스트 전 미리 실행
    beforeEach(async () => {
        lottery = await Lottery.new();  // 테스트를 위한 새로운 스마트컨트랙트 배포
    })
    
    it('Basic test', async () => {
        let owner = await lottery.owner();
        let value = await lottery.getSomeValue();

        console.log(`owner : ${owner}`);
        console.log(`value : ${value}`);
        assert.equal(value, 5);
    })

    it('getPot should return current pot', async () => {
        let pot = await lottery.getPot();

        console.log(`pot : ${pot}`);
        assert.equal(pot, 0);
    })

    // Bet 테스트 모듈
    describe('Bet', function() {
        // 트랜잭션 실패 (assertRevernt)
        it('should fail when the bet money is not 0.005 ETH', async() => {
            await assertRevert(lottery.Bet('0xab', {from : user1, value:4000000000000000}));
        })

        // 트랜잭션 성공
        it('should put the bet to the bet queue with 1 bet', async() => {
            let receipt = await lottery.Bet('0xab', {from : user1, value : betAmount});
            // console.log(receipt);    // 이벤트 로그 확인

            // 팟머니 확인
            let pot = await lottery.getPot();
            assert.equal(pot, 0);

            // 배팅금액 확인
            let contractBalance = await web3.eth.getBalance(lottery.address);
            assert.equal(contractBalance, betAmount);

            // 배팅정보 확인
            let currentBlockNumber = await web3.eth.getBlockNumber();
            let bet = await lottery.getBetInfo(0);
            assert.equal(bet.answerBlockNumber, currentBlockNumber + bet_block_interval);
            assert.equal(bet.bettor, user1);
            assert.equal(bet.challenges, '0xab');

            // 이벤트 로그 확인 (expectEvent)
            await expectEvent.inLogs(receipt.logs, 'BET');
        })
    })

    // Distribute 테스트모듈
    describe('Distribute', function () {

        // Checkable
        describe('When the answer is checkable', function () {

            // Win
            it('should give the user the pot when the answer matches', async () => {
                await lottery.SetTestMode('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', {from:deployer})
                
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 1 -> 4 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 2 -> 5 (Fail)
                await lottery.Bet_Distribute('0xab', {from:user1, value:betAmount}) // 3 -> 6 (Win)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 4 -> 7 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 5 -> 8 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 6 -> 9 (Fail)
                
                let potBefore = await lottery.getPot(); // == 0.01 ETH (2번 누적)
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                //7번블록이 생성되어야 6번블록의 해시값을 확인할 수 있으므로, 7번블록까지 생성, user1에게 팟머니가 지급된다)
                let receipt7 = await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 7 -> 10 (Fail)

                let potAfter = await lottery.getPot(); // == 0 (지급 완료)
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before + 0.015 ETH (user1 배팅금액 포함)
                
                // 팟머니풀의 변화량 확인
                assert.equal(potBefore.toString(), betAmountBN * 2);
                assert.equal(potAfter.toString(), 0);

                // user1의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(potBefore).add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString())
            })

            // Draw
            it('should give the user the amount he or she bet when a single character matches', async () => {
                await lottery.SetTestMode('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', {from:deployer})
                
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 1 -> 4 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 2 -> 5 (Fail)
                await lottery.Bet_Distribute('0xaf', {from:user1, value:betAmount}) // 3 -> 6 (Draw)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 4 -> 7 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 5 -> 8 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 6 -> 9 (Fail)
                
                let potBefore = await lottery.getPot(); //  == 0.01 ETH (2번 누적)
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                //7번블록이 생성되어야 6번블록의 해시값을 확인할 수 있으므로, 7번블록까지 생성)
                let receipt7 = await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 7 -> 10 (Fail)

                let potAfter = await lottery.getPot(); // == 0.01 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before + 0.005 ETH
                
                // 팟머니풀의 변화량 확인
                assert.equal(potBefore.toString(), potAfter.toString());

                // user1의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString())
            })

            // Fail
            it('should get the eth of user when the answer does not match at all', async () => {
                await lottery.SetTestMode('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', {from:deployer})
                
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 1 -> 4 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 2 -> 5 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user1, value:betAmount}) // 3 -> 6 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 4 -> 7 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 5 -> 8 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 6 -> 9 (Fail)
                
                let potBefore = await lottery.getPot(); // == 0.01 ETH (2번 누적)
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                //7번블록이 생성되어야 6번블록의 해시값을 확인할 수 있으므로, 7번블록까지 생성)
                let receipt7 = await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 7 -> 10 (Fail)

                let potAfter = await lottery.getPot(); // == 0.015 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before
                
                // 팟머니풀의 변화량 확인
                assert.equal(potBefore.add(betAmountBN).toString(), potAfter.toString());

                // user1의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.toString(), new web3.utils.BN(user1BalanceAfter).toString())
            })
        })

        // Not revealed
        describe('When the answer is not revealed(Not revealed)', function () {
            it('should not change the user1 balance and the pot and the owner balance', async () => {
                await lottery.SetTestMode('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', {from:deployer})
                
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 1 -> 4 (Fail)
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 2 -> 5 (Fail)
                await lottery.Bet_Distribute('0xab', {from:user1, value:betAmount}) // 3 -> 6 (Win)
                
                let potBefore = await lottery.getPot(); // == 0 ETH
                let ownerBalanceBefore = await web3.eth.getBalance(deployer);
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                // 아직 4번 블록이 생성되지 않았다 == 3번 블록해시값 확인 불가능
                await lottery.Bet_Distribute('0xef', {from:user2, value:betAmount}) // 4 -> 7 (Fail)

                let potAfter = await lottery.getPot(); // == 0 ETH
                let ownerBalanceAfter = await web3.eth.getBalance(deployer); // == before (transferAfterPayingFee 가 없다)
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before

                // 팟머니풀의 변화량 확인
                assert.equal(potBefore.toString(), potAfter.toString());

                // owner의 밸런스를 확인
                assert.equal(ownerBalanceBefore.toString(), ownerBalanceAfter.toString());

                // user1의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.toString(), new web3.utils.BN(user1BalanceAfter).toString())
            })
        })
        
        // Block limit is passed
        describe('When the answer is not checkable(Block limit is passed)', function () {
            // setAnswerForTest 같은 트랜잭션 300번 날리기
        })
    })

    // CompareNumber 테스트 모듈
    describe('isMatch', function () {
        let blockHash = '0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc'

        // Win
        it('should be BettingResult.Win when two characters match', async () => {
            
            let matchingResult = await lottery.CompareNumber('0xab', blockHash);
            assert.equal(matchingResult, 1);
        })

        // Fail
        it('should be BettingResult.Fail when two characters match', async () => {
            let matchingResult = await lottery.CompareNumber('0xcd', blockHash);
            assert.equal(matchingResult, 0);
        })

        // Draw
        it('should be BettingResult.Draw when two characters match', async () => {
            let matchingResult = await lottery.CompareNumber('0xaf', blockHash);
            assert.equal(matchingResult, 2);

            matchingResult = await lottery.CompareNumber('0xfb', blockHash);
            assert.equal(matchingResult, 2);
        })
    })
});