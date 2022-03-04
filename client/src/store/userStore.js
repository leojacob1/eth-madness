/* eslint-disable no-underscore-dangle */
import { makeAutoObservable, isObservableProp } from 'mobx';
// import firebase from 'firebase/app';
import { createBrowserHistory } from 'history';

// const history = createBrowserHistory();

class UserStore {

  userAddress = null


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

  clearStore() {
    this.userAddress = null;
  }

}

export default UserStore;
