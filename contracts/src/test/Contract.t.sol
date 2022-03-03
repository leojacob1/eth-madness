// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "ds-test/test.sol";
import "../EthMadness.sol";

interface CheatCodes {
    function prank(address) external;
}

contract ContractTest is DSTest {
    CheatCodes cheats = CheatCodes(HEVM_ADDRESS);
    EthMadness ethMadness;
    uint256[] transitionTimes = [
        1553187600,
        1554793199,
        1554879599,
        1555484399
    ];
    uint8 one = 22;
    uint8 two = 105;
    uint8 three = 89;
    uint8 four = 154;
    uint8 five = 154;
    uint8 six = 153;
    uint8 seven = 166;
    uint8 eight = 169;
    uint8 nine = 90;
    uint8 ten = 154;
    uint8 eleven = 102;
    uint8 twelve = 106;
    uint8 thirteen = 86;
    uint8 fourteen = 153;
    uint8 fifteen = 101;
    uint8 sixteen = 165;

    function concat(
        bytes1 b1,
        bytes1 b2,
        bytes1 b3,
        bytes1 b4,
        bytes1 b5,
        bytes1 b6,
        bytes1 b7,
        bytes1 b8,
        bytes1 b9,
        bytes1 b10,
        bytes1 b11,
        bytes1 b12,
        bytes1 b13,
        bytes1 b14,
        bytes1 b15,
        bytes1 b16
    ) public pure returns (bytes memory) {
        bytes memory result = new bytes(16);
        assembly {
            mstore(add(result, 1), b1)
            mstore(add(result, 2), b2)
            mstore(add(result, 3), b3)
            mstore(add(result, 4), b4)
            mstore(add(result, 5), b5)
            mstore(add(result, 6), b6)
            mstore(add(result, 7), b7)
            mstore(add(result, 8), b8)
            mstore(add(result, 9), b9)
            mstore(add(result, 10), b10)
            mstore(add(result, 11), b11)
            mstore(add(result, 12), b12)
            mstore(add(result, 13), b13)
            mstore(add(result, 14), b14)
            mstore(add(result, 15), b15)
            mstore(add(result, 16), b16)
        }
        return result;
    }

    function toBytes(uint8 x) private pure returns (bytes memory b) {
        b = new bytes(1);
        assembly {
            mstore(add(b, 1), x)
        }
    }

    uint64 scoreA = 0x5f;
    uint64 scoreB = 0x44;
    string bracketName = "reboot Pizza Investment Account";
    address fromAddress = 0x9bEF1f52763852A339471f298c6780e158E43A68;

    function setUp() public {
        ethMadness = new EthMadness(transitionTimes);
    }

    function testExample() public {
        cheats.prank(fromAddress);
        bytes16 picksBytes16 = bytes16(
            concat(
                bytes1(toBytes(one)),
                bytes1(toBytes(two)),
                bytes1(toBytes(three)),
                bytes1(toBytes(four)),
                bytes1(toBytes(five)),
                bytes1(toBytes(six)),
                bytes1(toBytes(seven)),
                bytes1(toBytes(eight)),
                bytes1(toBytes(nine)),
                bytes1(toBytes(ten)),
                bytes1(toBytes(eleven)),
                bytes1(toBytes(twelve)),
                bytes1(toBytes(thirteen)),
                bytes1(toBytes(fourteen)),
                bytes1(toBytes(fifteen)),
                bytes1(toBytes(sixteen))
            )
        );
        ethMadness.submitEntry(picksBytes16, scoreA, scoreB, bracketName);
    }
}
