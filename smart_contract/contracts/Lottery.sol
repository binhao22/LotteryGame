// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract Lottery {
    struct BetInfo {
        uint256 answerBlockNumber; // 유저가 해쉬값을 맞춰야하는 블록넘버
        address payable bettor; // 배팅에 참여한 유저 지갑주소
        bytes1 challenges; // 유저가 배탕한 블록해쉬값 ex)0xab..
    }

    address payable public owner; // 스마트컨트랙트 배포 지갑주소
    mapping(address => uint) pending; // 해당 주소가 팬딩중인 금액을 저장
    mapping(uint256 => BetInfo) private _bets; // 배팅 정보를 저장하는 큐
    uint256 private _head; // [0]
    uint256 private _tail;

    uint256 private _pot; // 팟머니
    bool private mode = true; // false : 블록체인상 해시값 사용 , true : 테스트모드에서 임의로 설정한 해시값 사용
    bytes32 public answerForTest; // 테스트모드 정답 해시값

    uint256 internal constant BET_AMOUNT = 5 * 10 ** 15; // 배팅금액 0.005ETH 고정
    uint256 internal constant BET_BLOCK_INTERVAL = 3; // 3번 뒤 블록 확인
    uint256 internal constant BLOCK_LIMIT = 256; // 스마트컨트랙트 내 확인 가능한 최대 블록 수 256개

    enum BlockStatus {
        // 현재 블록 상태
        Checkable,
        NotRevealed,
        BlockLimitPassed
    }
    enum BettingResult {
        // 배팅 결과
        Fail,
        Win,
        Draw
    }

    // 배팅 이벤트
    event BET(
        uint256 index,
        address bettor,
        uint256 amount,
        bytes1 challenges,
        uint256 answerBlockNumber
    );
    event WIN(
        uint256 index,
        address bettor,
        uint256 amount,
        bytes1 challenges,
        bytes1 answer,
        uint256 answerBlockNumber
    );
    event FAIL(
        uint256 index,
        address bettor,
        uint256 amount,
        bytes1 challenges,
        bytes1 answer,
        uint256 answerBlockNumber
    );
    event DRAW(
        uint256 index,
        address bettor,
        uint256 amount,
        bytes1 challenges,
        bytes1 answer,
        uint256 answerBlockNumber
    );
    event REFUND(
        uint256 index,
        address bettor,
        uint256 amount,
        bytes1 challenges,
        uint256 answerBlockNumber
    );

    constructor() {
        owner = payable(msg.sender);
    }

    function getSomeValue() public pure returns (uint256 value) {
        //test
        return 5;
    }

    // 팟머니 값을 리턴
    function getPot() public view returns (uint256 pot) {
        return _pot;
    }

    /**
     * @dev 배팅과 동시에 정답 체크를 한다. 유저는 0.005 ETH를 보내야 하고, 베팅용 1 byte 글자를 보낸다.
     * 큐에 저장된 베팅 정보는 이후 Distribute 함수에서 해결된다.
     * @param challenges 유저가 베팅하는 글자
     * @return result 함수가 잘 수행되었는지 확인해는 bool 값
     */
    function Bet_Distribute(
        bytes1 challenges
    ) public payable returns (bool result) {
        Bet(challenges);
        Distribute();

        return true;
    }

    /**
     * @dev 유저가 배팅을 한다. 유저는 0.005 ETH 를 배팅금액으로 지불해야하고, 배팅용 블록해쉬값 1 byte 글자를 보내야한다.
     * 큐에 저장된 배팅 정보는 이후 Distribute 함수에서 결과를 대조한다.
     * @param challenges 유저가 배팅하는 블록해쉬값 1byte 글자
     * @return result 함수가 잘 실행되었는지 확인하는 bool 값
     */
    function Bet(bytes1 challenges) public payable returns (bool result) {
        // ETH 가 정상적으로 전송되었는지 확인
        require(msg.value == BET_AMOUNT, "Not enough ETH");

        // 새로운 배팅 정보를 큐에 저장
        require(pushBetInfo(challenges), "fail to add a new Bet Info");

        // 배팅 이벤트 발생
        emit BET(
            _tail - 1, // 증가하기 전 index
            msg.sender,
            msg.value,
            challenges,
            block.number + BET_BLOCK_INTERVAL
        );

        return true;
    }

    /**
     * @dev 배팅 결과값을 확인 하고 팟머니를 분배한다.
     * 정답 실패 : 팟머니 축척, 정답 맞춤 : 팟머니 획득, 한글자 맞춤 or 정답 확인 불가 : 배팅 금액만 획득
     */
    function Distribute() public {
        uint256 cur; // 현재 블록넘버
        uint256 transferAmount; // 송금 금액

        BetInfo memory b;
        BlockStatus currentBlockStatus;
        BettingResult currentBettingResult;

        // head 3 4 5 6 7 8 9 10 11 12 tail
        for (cur = _head; cur < _tail; cur++) {
            b = _bets[cur];
            currentBlockStatus = getBlockState(b.answerBlockNumber);

            // Checkable : block.number > answerBlockNumber && block.number  <  BLOCK_LIMIT + answerBlockNumber 1
            if (currentBlockStatus == BlockStatus.Checkable) {
                bytes32 answerBlockHash = getAnswerBlockHash( // 블록해시값을 불러옴
                    b.answerBlockNumber
                );
                currentBettingResult = CompareNumber(
                    b.challenges,
                    answerBlockHash
                );

                // if win, 팟머니를 가져간다
                if (currentBettingResult == BettingResult.Win) {
                    pending[msg.sender] = _pot + BET_AMOUNT; // 송금 대기중인 금액
                    transferAmount = transferETH(b.bettor, _pot + BET_AMOUNT);

                    // pot = 0
                    _pot = 0;

                    // emit WIN
                    emit WIN(
                        cur,
                        b.bettor,
                        transferAmount,
                        b.challenges,
                        bytes1(answerBlockHash[0]),
                        b.answerBlockNumber
                    );
                }

                // if fail, 배팅한 금액이 팟머니풀로 들어간다
                if (currentBettingResult == BettingResult.Fail) {
                    // pot = pot + BET_AMOUNT
                    _pot += BET_AMOUNT;

                    // emit FAIL
                    emit FAIL(
                        cur,
                        b.bettor,
                        0,
                        b.challenges,
                        answerBlockHash[0],
                        b.answerBlockNumber
                    );
                }

                // if draw, 배팅한 금액을 돌려준다
                if (currentBettingResult == BettingResult.Draw) {
                    pending[msg.sender] = BET_AMOUNT; // 송금 대기중인 금액
                    transferAmount = transferETH(b.bettor, BET_AMOUNT);

                    // emit DRAW
                    emit DRAW(
                        cur,
                        b.bettor,
                        transferAmount,
                        b.challenges,
                        answerBlockHash[0],
                        b.answerBlockNumber
                    );
                }
            }

            // Not Revealed : block.number <= answerBlockNumber 2
            // 배팅한 블록이 아직 리빌되지않았으므로 중단
            if (currentBlockStatus == BlockStatus.NotRevealed) {
                break;
            }

            // Block Limit Passed : block.number >= answerBlockNumber + BLOCK_LIMIT 3
            // 블록해시값이 256 초과, 확인 불가함으로 배팅금액을 반환한다
            if (currentBlockStatus == BlockStatus.BlockLimitPassed) {
                pending[msg.sender] = BET_AMOUNT; // 송금 대기중인 금액
                transferAmount = transferETH(b.bettor, BET_AMOUNT);

                // emit refund
                emit REFUND(
                    cur,
                    b.bettor,
                    transferAmount,
                    b.challenges,
                    b.answerBlockNumber
                );
            }

            popBetInfo(cur);
        }
        _head = cur;
    }

    function transferETH(
        address payable addr,
        uint256 amount
    ) internal returns (uint256) {
        // 펜딩 대기중인 금액이 충분한지 확인
        require(pending[msg.sender] >= amount, "Balance is not enough");

        // 펜딩 대기중인 금액을 0으로 만들어, re-entrancy 공격을 방어
        pending[msg.sender] = 0;

        // 당첨자에게 팟머니 지급
        addr.transfer(amount);

        return amount;
    }

    // 외부 js 환경에서 테스트를 진행하기때문에, 함수 단위테스트를 위해 블록해시값을 임의로 정해주는 테스트모드
    function SetTestMode(bytes32 answer) public returns (bool result) {
        require(
            msg.sender == owner,
            "Only owner can set the answer for test mode"
        );
        answerForTest = answer;
        return true;
    }

    // 설정된 모드에 따라 불러오는 블록해시값이 달라진다
    function getAnswerBlockHash(
        uint256 answerBlockNumber
    ) internal view returns (bytes32 answer) {
        return mode ? blockhash(answerBlockNumber) : answerForTest;
    }

    /**
     * @dev 배팅글자와 정답을 확인한다.
     * @param challenges 배팅 글자
     * @param answer 블락해쉬
     * @return 정답결과
     */
    function CompareNumber(
        bytes1 challenges,
        bytes32 answer
    ) public pure returns (BettingResult) {
        // challenges 0xab
        // answer 0xab......ff 32 bytes

        bytes1 c1 = challenges;
        bytes1 c2 = challenges;

        bytes1 a1 = answer[0];
        bytes1 a2 = answer[0];

        // Get first number
        c1 = c1 >> 4; // 0xab -> 0x0a
        c1 = c1 << 4; // 0x0a -> 0xa0

        a1 = a1 >> 4;
        a1 = a1 << 4;

        // Get Second number
        c2 = c2 << 4; // 0xab -> 0xb0
        c2 = c2 >> 4; // 0xb0 -> 0x0b

        a2 = a2 << 4;
        a2 = a2 >> 4;

        if (a1 == c1 && a2 == c2) {
            return BettingResult.Win;
        }

        if (a1 == c1 || a2 == c2) {
            return BettingResult.Draw;
        }

        return BettingResult.Fail;
    }

    function getBlockState(
        uint256 answerBlockNumber
    ) internal view returns (BlockStatus) {
        if (
            // Checkable 1
            block.number > answerBlockNumber &&
            block.number < BLOCK_LIMIT + answerBlockNumber
        ) {
            return BlockStatus.Checkable;
        }

        if (block.number <= answerBlockNumber) {
            // NotRevealed 2
            return BlockStatus.NotRevealed;
        }

        if (block.number >= answerBlockNumber + BLOCK_LIMIT) {
            // BlockLimitPassed 3
            return BlockStatus.BlockLimitPassed;
        }

        return BlockStatus.BlockLimitPassed;
    }

    // 배팅 정보 확인
    function getBetInfo(
        uint256 index
    )
        public
        view
        returns (uint256 answerBlockNumber, address bettor, bytes1 challenges)
    {
        BetInfo memory b = _bets[index];
        answerBlockNumber = b.answerBlockNumber;
        bettor = b.bettor;
        challenges = b.challenges;
    }

    function pushBetInfo(bytes1 challenges) internal returns (bool) {
        BetInfo memory b;
        b.bettor = payable(msg.sender); // 트랜잭션을 전송하는 유저 지갑주소
        b.answerBlockNumber = block.number + BET_BLOCK_INTERVAL; // 트랜잭션이 생성되는 블록넘버 + 3
        b.challenges = challenges;

        _bets[_tail] = b;
        _tail++;

        return true;
    }

    function popBetInfo(uint256 index) internal returns (bool) {
        delete _bets[index];
        return true;
    }
}
