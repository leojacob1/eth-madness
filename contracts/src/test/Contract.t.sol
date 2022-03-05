// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "ds-test/test.sol";
import "../EthMadness.sol";

interface CheatCodes {
    function prank(address) external;

    function startPrank(address) external;
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
        "00101001101001100101010101101010101001100110100110101001100101010101011001011010010101101001010101010110101001011001010110011001";
    uint64 scoreA = 0x5f;
    uint64 scoreB = 0x44;
    string bracketName = "reboot Pizza Investment Account";
    address fromAddress = 0x9bEF1f52763852A339471f298c6780e158E43A68;
    address fromAddress2 = 0xa02AE450eC74cbDf331F94f1589020a48B6db719;

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

    // function concat(
    //     bytes memory b1,
    //     bytes1 b2,
    //     uint256 currentSize
    // ) public returns (bytes memory) {
    //     uint256 newSize = currentSize + 1;
    //     bytes memory result = new bytes(1);
    //     assembly {
    //         mstore(add(result, 1), b1)
    //         mstore(add(result, 1), b2)
    //     }
    //     return result;
    // }

    function convertEncodedPicksToByteArray(string memory bitString)
        private
        returns (bytes16)
    {
        require(bytes(bitString).length % 8 == 0, "Wrong size bit string");

        bytes memory result = new bytes(16);
        // result = new bytes(0);
        for (uint8 i = 0; i < bytes(bitString).length; i += 8) {
            uint256 index = i / 8;
            result[index] = bytes1(
                convertBitStringToNumber(substring(bitString, i, i + 8))
            );
            // result = concat(
            //     result,
            //     bytes1(
            //         convertBitStringToNumber(substring(bitString, i, i + 8))
            //     ),
            //     i / 8
            // );
        }
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
        ethMadness = new EthMadness();
    }

    function testExample() public {
        ethMadness.deleteLeoEntry();
        cheats.startPrank(fromAddress);
        ethMadness.submitEntry(
            convertEncodedPicksToByteArray(encodedPicks),
            scoreA,
            scoreB,
            bracketName
        );
        // entry has been set in entries and given the proper entryIndex
        (uint48 entryIndex, uint256 entryCompressed) = ethMadness.entries(
            fromAddress
        );
        assertEq(entryIndex, 0);
        assertGt(entryCompressed, 0);
        ethMadness.deleteLeoEntry();

        (, uint256 entryCompressed2) = ethMadness.entries(fromAddress);
        assertEq(entryCompressed2, 0);
        cheats.startPrank(fromAddress2);
        ethMadness.submitEntry(
            convertEncodedPicksToByteArray(encodedPicks),
            scoreA,
            scoreB,
            bracketName
        );
        (uint48 entryIndex3, uint256 entryCompressed3) = ethMadness.entries(
            fromAddress2
        );
        assertEq(entryIndex3, 1);
        assertGt(entryCompressed3, 0);
    }

    function testGetDependentGames() public {
        ethMadness.setGameResult(32, 0);
        ethMadness.setGameResult(0, 0);
        uint8[6] memory dependentGameIds = [63, 63, 63, 63, 63, 63];
        dependentGameIds[ethMadness.getRoundForGame(uint8(32))] = 32;
        uint8 lowestDependentGame = 32;
        while (lowestDependentGame >= uint8(32)) {
            lowestDependentGame = ethMadness.getDependentGame(
                int8(lowestDependentGame)
            );
            dependentGameIds[
                ethMadness.getRoundForGame(uint8(lowestDependentGame))
            ] = lowestDependentGame;
        }
        assertEq(dependentGameIds[0], 0);
        assertEq(dependentGameIds[1], 32);

        // ethMadness.setGameResult(49, 0);
        // ethMadness.setGameResult(34, 0);
        // ethMadness.setGameResult(4, 1);
        // newDependentGames = ethMadness.getDependentGameRecursive(
        //     dependentGames,
        //     49
        // );
        // assertEq(newDependentGames[0], 49);
        // assertEq(newDependentGames[1], 34);
        // assertEq(newDependentGames[2], 4);
    }

    function testValidatePick() public {
        cheats.startPrank(fromAddress);
        ethMadness.submitEntry(
            convertEncodedPicksToByteArray(encodedPicks),
            scoreA,
            scoreB,
            bracketName
        );
        ethMadness.setGameResult(32, 0);
        ethMadness.setGameResult(0, 1);
        cheats.startPrank(fromAddress);
        bool isPickRight = ethMadness.validateGamePick(32);
        if (isPickRight == true) {
            emit log("yes");
        } else {
            emit log("no");
        }
        // assertTrue(isPickRight, true);
    }

    // function testMintToken() public {
    //     ethMadness.deleteLeoEntry();
    //     cheats.startPrank(fromAddress);
    //     ethMadness.submitEntry(
    //         convertEncodedPicksToByteArray(encodedPicks),
    //         scoreA,
    //         scoreB,
    //         bracketName
    //     );
    // }

    function testShouldBreak() public {
        ethMadness.deleteLeoEntry();
        cheats.startPrank(fromAddress);

        ethMadness.submitEntry(
            convertEncodedPicksToByteArray(encodedPicks),
            scoreA,
            scoreB,
            bracketName
        );
        cheats.startPrank(fromAddress);

        ethMadness.submitEntry(
            convertEncodedPicksToByteArray(encodedPicks),
            scoreA,
            scoreB,
            bracketName
        );
    }
}
