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
  const parsedQs = queryString.parse(window.location.search);
  const networkId = parsedQs['networkId'] || '1';
  const deployedNetwork = EthMadness.networks[networkId];

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  let contractInstance = new ethers.Contract("0x3f556287834294b58a162c522acbc52cf872ad97", EthMadness.abi, provider);
  const signer = provider.getSigner();
  contractInstance = contractInstance.connect(signer);

  return { networkId, contractInstance, "0x3f556287834294b58a162c522acbc52cf872ad97": deployedNetwork.address, provider };
}

export const getProviderAndAccounts = async () => {
  const { networkId, contractInstance, contractAddress, provider } = await getContractInstance(true);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  console.log('ACCOUNTS', accounts)
  return { accounts, networkId, contractInstance, contractAddress, provider };
}

function* loadContractInfo(includeAdminStuff) {
  try {
    const { contractInstance, networkId, contractAddress } = yield call(getContractInstance, false);

    const currentState = yield call(contractInstance.methods.currentState().call);
    const entryCount = yield call(contractInstance.methods.getEntryCount().call);

    if (includeAdminStuff) {
      const oracleCount = yield call(contractInstance.methods.getOracleCount().call);
      const oracles = [];
      for (let i = 0; i < oracleCount; i++) {
        const oracleAddress = yield call(contractInstance.methods.oracles(i).call);
        const oracleVote = yield call(contractInstance.methods.oracleVotes(oracleAddress).call);
        oracles.push({
          oracleAddress,
          oracleVote
        });
      }

      const transitionTimesArray = yield call(contractInstance.methods.getTransitionTimes().call);

      const first = yield call(contractInstance.methods.topThree(0).call);
      const second = yield call(contractInstance.methods.topThree(1).call);
      const third = yield call(contractInstance.methods.topThree(2).call);
      const prizeAmount = yield call(contractInstance.methods.prizeAmount().call);
      const prizeERC20TokenAddress = yield call(contractInstance.methods.prizeERC20TokenAddress().call);
      const transitionTimes = {
        [ContestState.TOURNAMENT_IN_PROGRESS]: parseInt(transitionTimesArray[0]) * 1000,
        [ContestState.WAITING_FOR_ORACLES]: parseInt(transitionTimesArray[1]) * 1000,
        [ContestState.WAITING_FOR_WINNING_CLAIMS]: parseInt(transitionTimesArray[2]) * 1000,
        [ContestState.COMPLETED]: parseInt(transitionTimesArray[3]) * 1000,
      };

      const metadata = {
        currentState,
        networkId,
        contractAddress,
        entryCount,
        oracles,
        transitionTimes,
        first,
        second,
        third,
        prizeAmount,
        prizeERC20TokenAddress
      }

      yield put(Actions.setContractMetadata(metadata, true));
      yield call(loadEntries);
    } else {
      const metadata = {
        currentState,
        networkId,
        contractAddress,
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
  const { contractInstance, accounts } = yield call(getProviderAndAccounts);
  const fromAddress = accounts[0];
  yield call(contractInstance.methods.submitOracleVote(action.oracleIndex, results, scoreA, scoreB).send, {
    from: fromAddress
  });
}

function* addOracle(action) {
  const { contractInstance, accounts } = yield call(getProviderAndAccounts);
  const fromAddress = accounts[0];
  yield call(contractInstance.methods.addOracle(action.oracleAddress).send, {
    from: fromAddress
  });
}

function* advanceContestState(action) {
  try {
    console.log('Advancing state');
    const { contractInstance, accounts } = yield call(getProviderAndAccounts);
    const fromAddress = accounts[0];
    switch (action.nextState) {
      case ContestState.TOURNAMENT_IN_PROGRESS:
        yield call(contractInstance.methods.markTournamentInProgress().send, {
          from: fromAddress
        });
        break;
      case ContestState.WAITING_FOR_ORACLES:
        yield call(contractInstance.methods.markTournamentFinished().send, {
          from: fromAddress
        });
        break;
      case ContestState.COMPLETED:
        yield call(contractInstance.methods.closeContestAndPayWinners().send, {
          from: fromAddress
        });
        break;
      default:
        throw new Error('Unsupported next state');
    }

    const currentState = yield call(contractInstance.methods.currentState().call);
    yield put(Actions.setContractMetadata({ currentState }));

  } catch (e) {
    console.error(e);
  }
}

function* closeOracleVoting(action) {
  const { results, scoreA, scoreB } = action;
  const { contractInstance, accounts } = yield call(getProviderAndAccounts);
  const fromAddress = accounts[0];
  yield call(contractInstance.methods.closeOracleVoting(results, scoreA, scoreB).send, {
    from: fromAddress
  });
}

function* claimTopEntry(action) {
  const { contractInstance, accounts } = yield call(getProviderAndAccounts);
  const fromAddress = accounts[0];
  yield call(contractInstance.methods.claimTopEntry(action.entryCompressed).send, {
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

function* loadEntries() {
  try {
    const { contractInstance, provider } = yield call(getContractInstance, false);
    const events = yield call(() => new Promise((resolve, reject) => {
      contractInstance.getPastEvents('EntrySubmitted', {
        fromBlock: '0x70c3a0',
        toBlock: 'latest'
      }, (error, events) => {
        if (error) {
          reject(error);
        } else {
          resolve(events);
        }
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
