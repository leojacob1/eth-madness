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
    string encodedPicks =
        "00010110011010010101100110011010100110101001100110100110101010010101101010011010011001100110101001010110100110010110010110100101";
    uint64 scoreA = 0x5f;
    uint64 scoreB = 0x44;
    string bracketName = "reboot Pizza Investment Account";
    address fromAddress = 0x9bEF1f52763852A339471f298c6780e158E43A68;

    function substring(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function concat(
        bytes memory b1,
        bytes1 b2,
        uint256 currentSize
    ) public returns (bytes memory) {
        uint256 newSize = currentSize + 1;
        bytes memory result = new bytes(newSize);
        emit log_uint(newSize);
        assembly {
            mstore(add(result, currentSize), b1)
            mstore(add(result, newSize), b2)
        }
        return result;
    }

    function convertEncodedPicksToByteArray(string memory bitString)
        private
        returns (bytes16)
    {
        require(bytes(bitString).length % 8 == 0, "Wrong size bit string");

        bytes memory result = new bytes(16);
        for (uint8 i = 0; i < bytes(bitString).length; i += 8) {
            result = concat(
                result,
                bytes1(
                    convertBitStringToNumber(substring(bitString, i, i + 8))
                ),
                i / 8
            );
        }

        emit log_uint(result.length);

        return bytes16(result);
    }

    function convertBitStringToNumber(string memory bits)
        private
        returns (uint8)
    {
        require(bytes(bits).length == 8, "Wrong size bit string");
        uint256 result = 0;
        for (uint256 i = uint256(bytes(bits).length - 1); i > 0; i--) {
            if (bytes(bits)[i] == bytes1("1")) {
                uint256 power = uint256((bytes(bits).length - i) - 1);
                result += uint256(2**power);
            }
        }
        return uint8(result);
    }

    function stringToBytes16(string memory source)
        public
        pure
        returns (bytes16 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 16))
        }
    }

    // function stringToUint(string memory s)
    //     private
    //     pure
    //     returns (uint256 result)
    // {
    //     bytes memory b = bytes(s);
    //     uint256 i;
    //     result = 0;
    //     for (i = 0; i < b.length; i++) {
    //         uint256 c = uint256(b[i]);
    //         if (c >= 48 && c <= 57) {
    //             result = result * 10 + (c - 48);
    //         }
    //     }
    // }

    function setUp() public {
        ethMadness = new EthMadness(transitionTimes);
    }

    function testExample() public {
        cheats.prank(fromAddress);
        emit log(encodedPicks);
        // bytes16 picksBytes16 = stringToBytes16(encodedPicks);
        // emit log_bytes32(bytes32(picksBytes16));

        ethMadness.submitEntry(
            convertEncodedPicksToByteArray(encodedPicks),
            scoreA,
            scoreB,
            bracketName
        );
    }
}
