import { all, call, put, takeLeading, takeLatest } from 'redux-saga/effects'
import queryString from 'query-string';
import EthMadness from "../contracts/EthMadness.json";
import Web3 from 'web3';
import * as ActionTypes from '../actions/actionTypes';
import * as Actions from '../actions';
import * as ContestState from '../utils/ContestState';
import { convertEncodedPicksToByteArray } from '../utils/converters';
import { getWeb3WithAccounts } from '../utils/getWeb3';
import { utils, BigNumber, ethers } from 'ethers';
import ethMadnessContractAddress from '../Ethers/ethMadnessContractAddress';

const getWeb3ForNetworkId = async (networkId, accountsNeeded) => {
  if (accountsNeeded) {
    const provider = await getWeb3WithAccounts();
    try {
      const networkIdOfProvider = await provider.eth.net.getId();

      // Intentional != here, comparing string and number. 
      if (networkId.toString() !== networkIdOfProvider.toString()) {
        throw new Error(`Web3 instance connected to the wrong network. Expected ${networkId}, Actual ${networkIdOfProvider}`);
      }

      return provider;
    } catch (e) {
      console.error('Error trying to get web3 with accounts');
      console.error(e);
      throw new Error('no_web3');
    }

  } else {
    const nsApiKey = '69bbfd65cae84e6bae3c62c2bde588c6';
    switch (networkId) {
      case '5777':
        return Promise.resolve(new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545')));
      case '42':
        return Promise.resolve(new Web3(new Web3.providers.HttpProvider(`https://ethereum.api.nodesmith.io/v1/kovan/jsonrpc?apiKey=${nsApiKey}`)));
      case '1':
        return Promise.resolve(new Web3(new Web3.providers.HttpProvider(`https://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc?apiKey=${nsApiKey}`)));
      default:
        throw new Error(`Unknown network id ${networkId}`);
    }
  }
}

export const getContractInstance = async (accountsNeeded) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  let ethMadnessContract = new ethers.Contract(ethMadnessContractAddress, EthMadness.abi, provider);
  const signer = provider.getSigner();
  ethMadnessContract = ethMadnessContract.connect(signer);
  const ethersProps = { ethMadnessContract, provider };

  return { ethMadnessContract, provider };
}

function* loadContractInfo(includeAdminStuff) {
  try {
    const { ethMadnessContract } = yield call(getContractInstance, false);

    const currentState = yield call(ethMadnessContract.currentState());
    const entryCount = yield call(ethMadnessContract.getEntryCount());

    if (includeAdminStuff) {
      const oracleCount = yield call(ethMadnessContract.getOracleCount());
      const oracles = [];
      for (let i = 0; i < oracleCount; i++) {
        const oracleAddress = yield call(ethMadnessContract.oracles(i));
        const oracleVote = yield call(ethMadnessContract.oracleVotes(oracleAddress));
        oracles.push({
          oracleAddress,
          oracleVote
        });
      }

      const transitionTimesArray = yield call(ethMadnessContract.getTransitionTimes());
      const transitionTimes = {
        [ContestState.TOURNAMENT_IN_PROGRESS]: parseInt(transitionTimesArray[0]) * 1000,
        [ContestState.WAITING_FOR_ORACLES]: parseInt(transitionTimesArray[1]) * 1000,
        [ContestState.WAITING_FOR_WINNING_CLAIMS]: parseInt(transitionTimesArray[2]) * 1000,
        [ContestState.COMPLETED]: parseInt(transitionTimesArray[3]) * 1000,
      };

      const metadata = {
        currentState,
        entryCount,
        oracles,
        transitionTimes,
      }

      yield put(Actions.setContractMetadata(metadata, true));
      yield call(loadEntries);
    } else {
      const metadata = {
        currentState,
        entryCount
      };

      yield put(Actions.setContractMetadata(metadata, false));
    }

  }
  catch (e) {
    console.error(e);
  }
}

function* submitOracleVote(action) {
  const { results, scoreA, scoreB } = action;
  const { contractInstance, accounts } = action.ethersProps;
  const fromAddress = accounts[0];
  yield call(contractInstance.submitOracleVote(action.oracleIndex, results, scoreA, scoreB), {
    from: fromAddress
  });
}

function* addOracle(action) {
  const { contractInstance, accounts } = action.ethersProps;
  const fromAddress = accounts[0];
  yield call(contractInstance.addOracle(action.oracleAddress), {
    from: fromAddress
  });
}

function* advanceContestState(action) {
  try {
    console.log('Advancing state');
    const { contractInstance, accounts } = action.ethersProps;
    const fromAddress = accounts[0];
    switch (action.nextState) {
      case ContestState.TOURNAMENT_IN_PROGRESS:
        yield call(contractInstance.markTournamentInProgress(), {
          from: fromAddress
        });
        break;
      case ContestState.WAITING_FOR_ORACLES:
        yield call(contractInstance.markTournamentFinished(), {
          from: fromAddress
        });
        break;
      case ContestState.COMPLETED:
        yield call(contractInstance.closeContestAndPayWinners(), {
          from: fromAddress
        });
        break;
      default:
        throw new Error('Unsupported next state');
    }

    const currentState = yield call(contractInstance.currentState());
    yield put(Actions.setContractMetadata({ currentState }));

  } catch (e) {
    console.error(e);
  }
}

function* closeOracleVoting(action) {
  const { results, scoreA, scoreB } = action;
  const { contractInstance, accounts } = action.ethersProps;
  const fromAddress = accounts[0];
  yield call(contractInstance.closeOracleVoting(results, scoreA, scoreB), {
    from: fromAddress
  });
}

function* claimTopEntry(action) {
  const { contractInstance, accounts } = action.ethersProps;
  const fromAddress = accounts[0];
  yield call(contractInstance.claimTopEntry(action.entryCompressed), {
    from: fromAddress
  });
}

const byteArrayToHex = (byteArray, add0x) => {
  const result = byteArray.map(b => {
    const byte = b.toString(16);
    return byte.length === 2 ? byte : ("0" + byte);
  }).join('');

  return add0x ? ('0x' + result) : result;
}

function* loadEntries(ethersProps) {
  try {
    console.log('we in dis bitch')
    const { ethMadnessContract } = yield call(getContractInstance, false);
    const events = yield call(() => new Promise((resolve, reject) => {
      const emptyFilter = ethMadnessContract.filters.EntrySubmitted(null, null);
      ethMadnessContract.queryFilter(null, null, null)
        .then((events) => {
          resolve(events);
        })
        .catch((err) => {
          reject(err)
        });
    }));

    const convertedEvents = events.map(event => {
      const entryCompressedArray = BigNumber.from(event.returnValues.entryCompressed).toArray();
      while (entryCompressedArray.length < 32) {
        // Pad the array until we get to 32 bytes
        entryCompressedArray.unshift(0);
      }

      const scoreABytes = entryCompressedArray.slice(0, 8);
      const scoreBBytes = entryCompressedArray.slice(8, 16);

      const scoreA = parseInt(byteArrayToHex(scoreABytes, false), 16);
      const scoreB = parseInt(byteArrayToHex(scoreBBytes, false), 16);

      const picksBytes = entryCompressedArray.slice(16, 32);
      const picks = byteArrayToHex(picksBytes, true);

      const entryCompressed = byteArrayToHex(entryCompressedArray, true);
      console.log('load entry saga');
      return {
        transactionHash: event.transactionHash,
        entrant: event.returnValues.submitter,
        entryIndex: event.returnValues.entryIndex,
        picks,
        scoreA,
        scoreB,
        entryCompressed,
        message: event.returnValues.bracketName
      };
    })

    yield put(Actions.setEntries(convertedEvents));

  } catch (e) {
    console.error(e);
  }
}

function* mySaga() {
  yield all([
    loadContractInfo(),
    takeLatest(ActionTypes.ADVANCE_CONTEST_STATE, advanceContestState),
    takeLeading(ActionTypes.LOAD_ENTRIES, loadEntries),
    takeLeading(ActionTypes.SUBMIT_ORACLE_VOTE, submitOracleVote),
    takeLatest(ActionTypes.ADD_ORACLE, addOracle),
    takeLatest(ActionTypes.CLAIM_TOP_ENTRY, claimTopEntry),
    takeLatest(ActionTypes.CLOSE_ORACLE_VOTING, closeOracleVoting),
    takeLatest(ActionTypes.LOAD_ADMIN_METADATA, loadContractInfo.bind(undefined, true)),
  ]);
}

export default mySaga;
