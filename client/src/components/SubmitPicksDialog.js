import React, { Component, useContext } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { NavLink } from 'react-router-dom';
import { SubmitPicksContext } from '../store/context';
import { observer } from 'mobx-react';

const styles = theme => ({
  root: {
    height: 270,
    width: 320
  },
  textField: {
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  progress: {
    margin: theme.spacing.unit * 4,
    alignSelf: 'center'
  },
  viewBracketButton: {
    marginTop: 'auto',
    textDecoration: 'none'
  },
  successMessage: {
    marginTop: theme.spacing.unit * 2
  },
  errorBox: {
    height: 50,
    overflow: 'scroll',
    backgroundColor: theme.palette.grey['100']
  },
  metaMaskContainer: {
    textAlign: 'center',
    marginTop: theme.spacing.unit * 2
  }
});

/**
 * After a user has completed a bracket, this dialog will be shown, allowing them to submit
 * their bracket by sending an Ethereum transaction.
 */
const SubmitPicksDialog = observer((props) => {
  const submitPicksStore = useContext(SubmitPicksContext);
  const handleClose = () => {
    const clearPicks = submitPicksStore.submissionStatus.state === 'succeeded';
    submitPicksStore.hideSubmitPicksDialog(clearPicks);
  }

  const noWeb3 = () => {
    return (submitPicksStore.submissionStatus.state === 'failed' && submitPicksStore.submissionStatus.message === 'no_web3');
  }

  const getContent = () => {
    if (!submitPicksStore.isDialogShowing) {
      return null;
    }

    // If we can't successfully complete this call, show an error to the use.
    if (noWeb3()) {
      return (
        <div className={classes.content}>
          <DialogContentText align="center">
            Oops.  It looks like you don't have an Ethereum wallet installed.
            We recommend using MetaMask.
          </DialogContentText>
          <div className={classes.metaMaskContainer}>
            <a target="_blank" rel="noopener noreferrer" href="https://metamask.io/"><img alt="install-metamask" src="./metamasklogo.png" style={{ width: 200 }} /></a>
          </div>
          <Button style={{ marginTop: 16 }} onClick={handleClose} fullWidth variant="contained" >Close</Button>
        </div>
      );
    }

    switch (submitPicksStore.submissionStatus.state) {
      case 'pending':
        return (
          <div className={classes.content}>
            <DialogContentText align="center">
              Please approve the transaction to submit your bracket, then wait until the transaction is confirmed.
            </DialogContentText>
            <CircularProgress className={classes.progress} />
          </div>);
      case 'failed':
        return (
          <div className={classes.content}>
            <DialogContentText align="center">
              Sorry, something went wrong submitting your bracket.
            </DialogContentText>
            <pre className={classes.errorBox}>
              <code>
                {submitPicksStore.submissionStatus.message}
              </code>
            </pre>
            <Button onClick={handleClose} className={classes.viewBracketButton} fullWidth variant="contained" >Close</Button>
          </div>);
      case 'succeeded':
        const bracketLink = `${window.origin}/bracket/${submitPicksStore.submissionStatus.bracketId}`;
        const tweetContent = `Check out my March Madness bracket - stored in a smart contract via ethmadness.com built by @nodesmith %23ethmadness. ${bracketLink}`
        const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetContent}`;
        return (
          <div className={classes.content}>
            <div className={classes.successMessage}>
              <DialogContentText align="center">
                Bracket submission succeeded!
              </DialogContentText>
              <DialogContentText align="center">
                See transaction on <a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/tx/${submitPicksStore.submissionStatus.transactionHash}`}>etherescan</a>.
              </DialogContentText>
              <DialogContentText style={{ marginTop: 16, marginBottom: 16 }} align="center">
                Share your picks with your friends.&nbsp;
                <a href={tweetUrl} className="twitter-share-button">Tweet My Bracket</a>
              </DialogContentText>
            </div>
            <NavLink className={classes.viewBracketButton}
              to={{ pathname: `/bracket/${submitPicksStore.submissionStatus.bracketId}`, search: props.location.search }}>
              <Button onClick={handleClose} fullWidth variant="contained" >View Bracket</Button>
            </NavLink>
          </div>);
      default:
        throw new Error('unexpected state in SubmitPickDialog');
    }
  }

  const { classes } = props;

  const isNoWeb3 = noWeb3();

  return (
    <Dialog disableBackdropClick={!isNoWeb3} disableEscapeKeyDown={!isNoWeb3}
      classes={{ paper: classes.root }} maxWidth="xs" onClose={handleClose} open={submitPicksStore.isDialogShowing}>
      <DialogTitle align="center">Submitting Bracket</DialogTitle>
      <DialogContent classes={{ root: classes.content }}>
        {getContent()}
      </DialogContent>
    </Dialog>
  );
})

SubmitPicksDialog.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SubmitPicksDialog);
