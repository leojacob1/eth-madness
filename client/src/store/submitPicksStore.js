/* eslint-disable no-underscore-dangle */
import { makeAutoObservable, isObservableProp } from 'mobx';
// import firebase from 'firebase/app';
import { createBrowserHistory } from 'history';
import tournamentTeams from '../models/teams.json';
import { getProviderAndAccounts } from '../sagas';
import { utils, BigNumber, ethers } from 'ethers';
import { convertEncodedPicksToByteArray } from '../utils/converters';

// const history = createBrowserHistory();

class SubmitPicksStore {
  userAddress = null
  isDialogShowing = false
  userEmail = ''
  receiveUpdates = false
  submissionStatus = {
    state: 'pending'
  }

  constructor() {
    makeAutoObservable(this);
    this.getConnectedWallet();
  }

  async getConnectedWallet() {
    this.userAddress = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
  }

  signInWithEthereum(firebase, address) {
    this.userAddress = address;
  }

  submitPicks() {
    this.isDialogShowing = true;
    this.submissionStatus = {
      state: 'pending'
    }
  }

  setPicksSuccess(txnHash, entryIndex) {
    this.submissionStatus = {
      state: 'succeeded',
      transactionHash: txnHash,
      bracketId: entryIndex
    }
  }

  setPicksFailure(message) {
    this.submissionStatus = {
      state: 'failed',
      message
    }

  }

  hideSubmitPicksDialog() {
    this.isDialogShowing = false
  }

  clearStore() {
    this.isDialogShowing = false
    this.userEmail = ''
    this.receiveUpdates = false
    this.submissionStatus = {
      state: 'pending'
    }
  }

}

export default SubmitPicksStore;
