import React, { useContext, useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import { SubmitPicksContext } from '../store/context';

const ConnectButton = observer(() => {
  const submitPicksStore = useContext(SubmitPicksContext);
  const activateBrowserWallet = async () => {
    if (!window.ethereum) {
      alert("Get MetaMask!");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    submitPicksStore.signInWithEthereum(accounts[0].toLowerCase());
  }

  return (
    <>
      {submitPicksStore.userAddress ? (
        <div styles={{ backgroundColor: 'secondary.main', borderRadius: '5px', p: 1 }}>
          <Typography>{submitPicksStore.userAddress}</Typography>
        </div>
      ) : <Button color="secondary" variant="contained" onClick={activateBrowserWallet}>Connect wallet</Button>
      }
    </>
  )
})

export default ConnectButton;