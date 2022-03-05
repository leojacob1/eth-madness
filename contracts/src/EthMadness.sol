pragma solidity ^0.8.10;
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "ds-test/test.sol";

contract EthMadness is Ownable, DSTest {
    // Represents the submission to the contest.
    struct Entry {
        // The "index" of this entry. Used to break ties incase two submissions are the same. (earlier submission wins)
        uint48 entryIndex;
        uint256 entryCompressed;
    }

    // Represents the results of the contest.
    struct Result {
        // The encoded results of the tournament
        bytes16 winners;
        // Team A's score in the final
        uint8 scoreA;
        // Team B's score in the final
        uint8 scoreB;
        // Whether or not this is the final Results (used to tell if a vote is real or not)
        bool isFinal;
    }

    // Represents the various states that the contest will go through.
    enum ContestState {
        // The contest is open for people to submit entries. Oracles can also be added during this period.
        OPEN_FOR_ENTRIES,
        // The tournament is in progress, no more entries can be received and no oracles can vote
        TOURNAMENT_IN_PROGRESS,
        // The tournament is over and we're waiting for all the oracles to submit the results
        WAITING_FOR_ORACLES,
        // The oracels have submitted the results and we're waiting for winners to claim their prize
        WAITING_FOR_WINNING_CLAIMS,
        // The contest has completed and the winners have been paid out
        COMPLETED
    }

    // Maximum number of entries that will be allowed
    uint256 constant MAX_ENTRIES = 2**48;

    // The number of entries which have been received.
    uint48 entryCount = 0;

    // Map of the submitter address to encoded entry with index.
    mapping(address => Entry) public entries;

    // The times where we're allowed to transition the contract's state
    // mapping(uint256 => uint256) public transitionTimes;

    // The current state of the contest
    ContestState public currentState;

    // The recorded votes of our oracles
    mapping(address => Result) public oracleVotes;

    // game results to be updated frequently by oracle (0 is top team win, 1 is bottom team win)
    mapping(uint256 => uint8) public gameResults;

    // The oracles who will submit the results of the tournament
    address[] public oracles;

    // The maximum number of oracles we'll allow vote in our contest
    uint256 constant MAX_ORACLES = 10;

    // The final result of the tournament that the oracles agreed on
    Result public finalResult;

    // The amount of the prize to reward
    // uint256 public prizeAmount;

    // Event emitted when a new entry gets submitted to the contest
    event EntrySubmitted(
        // The account who submitted this bracket
        address indexed submitter,
        // A compressed representation of the entry combining the picks and final game scores
        uint256 indexed entryCompressed,
        // The order this entry was received. Used for tiebreaks
        uint48 indexed entryIndex,
        // Optional bracket name provided by the submitter
        string bracketName
    );

    // Constructs a new instance of the EthMadness contract with the given transition times
    constructor() public {
        // Initialize the oracles array with the sender's address
        oracles = [msg.sender];
    }

    // Gets the total number of entries we've received
    function getEntryCount() public view returns (uint256) {
        return entryCount;
    }

    // Gets the number of Oracles we have registered
    function getOracleCount() public view returns (uint256) {
        return oracles.length;
    }

    // Internal function for advancing the state of the bracket
    function advanceState(ContestState nextState) private {
        require(
            uint256(nextState) == uint256(currentState) + 1,
            "Can only advance state by 1"
        );

        currentState = nextState;
    }

    int8[6] roundFirstGameIds = [
        int8(62),
        int8(60),
        int8(56),
        int8(48),
        int8(32),
        int8(0)
    ];

    function getDependentGame(int8 gameId) public returns (uint8) {
        for (uint8 i = 0; i < 5; i++) {
            if ((gameId - roundFirstGameIds[i]) >= 0) {
                uint8 potentialGameId1 = uint8(
                    roundFirstGameIds[i + 1] +
                        (gameId - roundFirstGameIds[i]) *
                        2
                );
                uint8 potentialGameId2 = uint8(
                    roundFirstGameIds[i + 1] +
                        (gameId - roundFirstGameIds[i]) *
                        2 +
                        1
                );
                if (gameResults[uint8(gameId)] == 1) {
                    return potentialGameId2;
                } else {
                    return potentialGameId1;
                }
                break;
            }
        }
    }

    function validateGamePick(uint8 gameIdToValidate) public returns (bool) {
        uint8[6] memory dependentGameIds = [63, 63, 63, 63, 63, 63];
        dependentGameIds[getRoundForGame(gameIdToValidate)] = gameIdToValidate;
        uint8 lowestDependentGame = gameIdToValidate;
        while (lowestDependentGame >= uint8(32)) {
            lowestDependentGame = getDependentGame(int8(lowestDependentGame));
            dependentGameIds[
                getRoundForGame(lowestDependentGame)
            ] = lowestDependentGame;
        }
        for (uint256 i = 0; i < dependentGameIds.length; i++) {
            uint8 gameId = dependentGameIds[i];
            if (gameId == 63) {
                break;
            }
            uint256 entryCompressed = entries[msg.sender].entryCompressed;
            bytes16 picks = bytes16(
                uint128((entryCompressed & uint256((2**128) - 1)))
            );
            uint8 userPick = extractResult(picks, gameId) - 1;
            uint8 correctPick = gameResults[gameId];
            if (userPick != correctPick) {
                return false;
            }
            // TODO: get picks back from entryCompressed
            // Look up pick by gameId and compare to actual results
            // If all games are correct in dependentGameIds --> true
        }
        return true;
    }

    function mintTokenForGame(uint8 gameId) public {
        // make sure user submitted a bracket
        require(
            entries[msg.sender].entryIndex >= 0,
            "User has not submitted a bracket"
        );
        require(gameId >= 0, "Not a valid game");
        require(gameId <= 62, "Not a valid game");
        require(validateGamePick(gameId) == true, "This pick was not correct");
        // mint token
    }

    // for testing
    function setGameResult(uint256 gameId, uint8 result) external {
        gameResults[gameId] = result;
    }

    // for testing
    function deleteLeoEntry() external {
        delete entries[0x9bEF1f52763852A339471f298c6780e158E43A68];
    }

    // Submits a new entry to the tournament
    function submitEntry(
        bytes16 picks,
        uint64 scoreA,
        uint64 scoreB,
        string memory bracketName
    ) public returns (uint256) {
        require(
            currentState == ContestState.OPEN_FOR_ENTRIES,
            "Must be in the open for entries state"
        );

        // Do some work to encode the picks and scores into a single uint256 which becomes a key
        uint256 scoreAShifted = uint256(scoreA) * (2**(24 * 8));
        uint256 scoreBShifted = uint256(scoreB) * (2**(16 * 8));
        uint256 picksAsNumber = uint128(picks);
        uint256 entryCompressed = scoreAShifted | scoreBShifted | picksAsNumber;

        require(
            entries[msg.sender].entryCompressed == 0,
            "This user has submitted an entry already"
        );

        // Emit the event that this entry was received and save the entry
        emit EntrySubmitted(
            msg.sender,
            entryCompressed,
            entryCount,
            bracketName
        );
        Entry memory entry = Entry(entryCount, entryCompressed);
        entries[msg.sender] = entry;
        entryCount++;
        return entryCount;
    }

    // Returns either 0 if there is no possible winner, 1 if team B is chosen, or 2 if team A is chosen
    function extractResult(bytes16 a, uint8 n) private pure returns (uint8) {
        uint128 mask = uint128(0x00000000000000000000000000000003) *
            uint128(2)**(n * 2);
        uint128 masked = uint128(a) & mask;

        // Shift back to get either 0, 1 or 2
        return uint8(masked / (uint128(2)**(n * 2)));
    }

    // Adds an allowerd oracle who will vote on the results of the contest. Only the contract owner can do this
    // and it can only be done while the tournament is still open for entries
    function addOracle(address oracle) public onlyOwner {
        require(
            currentState == ContestState.OPEN_FOR_ENTRIES,
            "Must be accepting entries"
        );
        require(
            oracles.length < MAX_ORACLES - 1,
            "Must be less than max number of oracles"
        );
        oracles.push(oracle);
    }

    // Submits a new oracle's vote describing the results of the tournament
    function submitOracleVote(
        uint256 oracleIndex,
        bytes16 winners,
        uint8 scoreA,
        uint8 scoreB
    ) public {
        require(
            currentState == ContestState.WAITING_FOR_ORACLES,
            "Must be in waiting for oracles state"
        );
        require(oracles[oracleIndex] == msg.sender, "Wrong oracle index");
        // require(arePicksOrResultsValid(winners), "Results are not valid");
        oracleVotes[msg.sender] = Result(winners, scoreA, scoreB, true);
    }

    // Close the voting and set the final result. Pass in what should be the consensus agreed by the
    // 70% of the oracles
    function closeOracleVoting(
        bytes16 winners,
        uint8 scoreA,
        uint8 scoreB
    ) public {
        require(currentState == ContestState.WAITING_FOR_ORACLES);

        // Count up how many oracles agree with this result
        uint256 confirmingOracles = 0;
        for (uint256 i = 0; i < oracles.length; i++) {
            Result memory oracleVote = oracleVotes[oracles[i]];
            if (
                oracleVote.isFinal &&
                oracleVote.winners == winners &&
                oracleVote.scoreA == scoreA &&
                oracleVote.scoreB == scoreB
            ) {
                confirmingOracles++;
            }
        }

        // Require 70%+ of Oracles to have voted and agree on the result
        uint256 percentAggreement = (confirmingOracles * 100) / oracles.length;
        require(
            percentAggreement > 70,
            "To close oracle voting, > 70% of oracles must agree"
        );

        // Change the state and set our final result which will be used to compute scores
        advanceState(ContestState.WAITING_FOR_WINNING_CLAIMS);
        finalResult = Result(winners, scoreA, scoreB, true);
    }

    // Closes the entry period and marks that the actual tournament is in progress
    function markTournamentInProgress() public {
        advanceState(ContestState.TOURNAMENT_IN_PROGRESS);

        require(oracles.length > 0, "Must have at least 1 oracle registered");
    }

    // Mark that the tournament has completed and oracles can start submitting results
    function markTournamentFinished() public {
        advanceState(ContestState.WAITING_FOR_ORACLES);
    }

    // Gets the bit at index n in a
    function getBit16(bytes16 a, uint16 n) private pure returns (bool) {
        uint128 mask = uint128(2)**n;
        return uint128(a) & mask != 0;
    }

    // Sets the bit at index n to 1 in a
    function setBit16(bytes16 a, uint16 n) private pure returns (bytes16) {
        uint128 mask = uint128(2)**n;
        return a | bytes16(mask);
    }

    function shiftLeft(bytes1 a, uint8 n) private pure returns (bytes1) {
        uint8 shifted = uint8(uint8(a) * 2**n);
        return bytes1(shifted);
    }

    function negate(bytes1 a) private pure returns (bytes1) {
        return a ^ allOnes();
    }

    function clearBit16(bytes16 a, uint8 n) private pure returns (bytes16) {
        bytes1 mask = negate(shiftLeft(0x01, n));
        return a & mask;
    }

    function allOnes() private pure returns (bytes1) {
        uint8 max = 255;
        return bytes1(max); // 0 - 1, since data type is unsigned, this results in all 1s.
    }

    function getRoundForGame(uint8 gameId) public pure returns (uint8) {
        if (gameId < 32) {
            return 0;
        } else if (gameId < 48) {
            return 1;
        } else if (gameId < 56) {
            return 2;
        } else if (gameId < 60) {
            return 3;
        } else if (gameId < 62) {
            return 4;
        } else {
            return 5;
        }
    }

    // Gets the first game in a round given the round number
    function getFirstGameIdOfRound(uint8 round) private pure returns (uint8) {
        if (round == 0) {
            return 0;
        } else if (round == 1) {
            return 32;
        } else if (round == 2) {
            return 48;
        } else if (round == 3) {
            return 56;
        } else if (round == 4) {
            return 60;
        } else {
            return 62;
        }
    }
}
