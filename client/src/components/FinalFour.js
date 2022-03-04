import React, { Component, useContext } from 'react';
import PropTypes from 'prop-types';
import { withStyles, Paper, Button, Typography, TextField } from '@material-ui/core';
import Game, { HEIGHT } from './Game';
import { SubmitPicksContext, UserContext } from '../store/context';
import { observer } from 'mobx-react';
import { withEthers } from '../Ethers';
import { compose } from 'recompose';
import { getProviderAndAccounts } from '../sagas';
import { utils, BigNumber, ethers } from 'ethers';
import { convertEncodedPicksToByteArray } from '../utils/converters';

const styles = theme => ({
  root: {
    width: 700,
    height: 160,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'none'
  },
  games: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  submitButton: {
    marginTop: 'auto',
    alignSelf: 'flex-end'
  },
  finals: {
    width: 300,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing.unit * 1
  },
  scoreContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  staticScoreContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: theme.spacing.unit * 1
  },
  tweetContainer: {

  },
  staticFinalsGame: {
    margin: theme.spacing.unit * 1
  },
  score: {
    width: theme.spacing.unit * 5,
    height: HEIGHT * 1.4,
    margin: 0
  },
  nameContainer: {
    width: '100%',
    marginBottom: theme.spacing.unit
  }
});

/**
 * Component that sits in the middle of a bracket. This component shows the two final 
 * four games, and also the large championship component.
 */
const FinalFour = observer((props) => {
  const submitPicksStore = useContext(SubmitPicksContext);
  const createGame = (game, makePick, roundNumber) => {
    const { isEditable, eliminatedTeamIds } = props;

    return (<Game
      key={game.gameId}
      gameId={game.gameId}
      topSlotId={game.topSlotId}
      bottomSlotId={game.bottomSlotId}
      currentPickSlotId={game.currentPickSlotId}
      topTeam={game.topTeam}
      bottomTeam={game.bottomTeam}
      makePick={makePick}
      isEditable={isEditable}
      gameResult={game.gameResult}
      eliminatedTeamIds={eliminatedTeamIds[roundNumber] || {}}
    />);
  }

  const submitPicks = async () => {
    const { encodedPicks, topTeamScore, bottomTeamScore, message, ethersProps } = props;
    console.log('final four', ethersProps)
    let submissionResult = null;
    const { contractInstance, provider, accounts } = await getProviderAndAccounts();
    const fromAddress = accounts[0];

    // const filter = contractInstance.filters.EntrySubmitted(fromAddress, null, null, null);
    // contractInstance.on(filter, (submitter, entryCompressed, entryIndex) => {
    //   // The to will always be "address"
    //   console.log('submitter', submitter, submissionResult, entryIndex);
    // });

    const picks = convertEncodedPicksToByteArray(encodedPicks);
    const scoreA = BigNumber.from(topTeamScore).toHexString();
    const scoreB = BigNumber.from(bottomTeamScore).toHexString();
    const bracketName = bracketName || '';

    console.log('submitBracket', picks, scoreA, scoreB, bracketName, fromAddress);

    ethersProps.ethMadnessContract.submitEntry(picks, scoreA, scoreB, bracketName, {
      from: fromAddress
    })
      .then(() => {
        console.log('hell ya')
      })
      .catch(() => {
        submitPicksStore.setPicksFailure('Fuck');
      })
    submitPicksStore.submitPicks();
    console.log('encoded picks', encodedPicks);
  }

  const getEditableFinalsComponent = () => {
    const { games, classes, makePick, submitEnabled, message, changeBracketProperty, topTeamScore, bottomTeamScore } = props;

    return (
      <Paper className={classes.finals} >
        <Typography align="center" variant="h6">Championship</Typography>
        <div className={classes.scoreContainer} >
          <TextField
            className={classes.score}
            variant="outlined"
            helperText="Winner Score"
            margin="dense"
            value={topTeamScore}
            onChange={(event) => changeBracketProperty('teamA', event.target.value)}
          />
          {createGame(games[2], makePick)}
          <TextField
            className={classes.score}
            variant="outlined"
            helperText="Loser Score"
            margin="dense"
            value={bottomTeamScore}
            onChange={(event) => changeBracketProperty('teamB', event.target.value)}
          />
        </div>
        <div className={classes.nameContainer} >
          <TextField
            fullWidth
            label="Bracket Name (Optional)"
            margin="dense"
            variant="outlined"
            value={message}
            onChange={(event) => changeBracketProperty('bracketName', event.target.value)}
          />
        </div>
        <Button className={classes.submitButton} color="primary" fullWidth variant="contained" disabled={!submitEnabled || !submitPicksStore.userAddress} onClick={() => submitPicks()} >Submit Bracket</Button>
      </Paper>
    )
  }

  const getStaticFinalsComponent = () => {
    const { games, classes, makePick, topTeamScore, bottomTeamScore, bracketId } = props;

    const bracketLink = `${window.origin}/bracket/${bracketId}`;
    const tweetContent = `Check out my March Madness bracket - stored in a smart contract via ethmadness.com built by @nodesmith %23ethmadness. ${bracketLink}`
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetContent}`;

    return (
      <Paper className={classes.finals} >
        <Typography align="center" variant="h6">Championship</Typography>

        <div className={classes.scoreContainer} >
          <div className={classes.staticScoreContainer} >
            <Typography align="center" >{topTeamScore}</Typography>
            <Typography align="center" variant="caption">Winner Score</Typography>
          </div>
          {createGame(games[2], makePick, 6)}
          <div className={classes.staticScoreContainer} >
            <Typography align="center" >{bottomTeamScore}</Typography>
            <Typography align="center" variant="caption">Loser Score</Typography>
          </div>
        </div>

        <div className={classes.staticScoreContainer} >
          <Typography >
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="twitter-share-button">Share This Bracket</a>
          </Typography>
        </div>
      </Paper>
    )
  }

  const { games, classes, makePick, isEditable } = props;
  return (
    <div className={classes.root}>
      <div className={classes.games}>
        <div className={classes.finalFour}>
          <Typography align="center" variant="caption">Final Four</Typography>
          {createGame(games[0], makePick, 5)}
        </div>
        {isEditable ? getEditableFinalsComponent() : getStaticFinalsComponent()}
        <div className={classes.finalFour}>
          <Typography align="center" variant="caption">Final Four</Typography>
          {createGame(games[1], makePick, 5)}
        </div>
      </div>
    </div>
  );
})

FinalFour.propTypes = {
  classes: PropTypes.object.isRequired,
  games: PropTypes.array.isRequired,
  submitEnabled: PropTypes.bool.isRequired,
  encodedPicks: PropTypes.string,
  topTeamScore: PropTypes.string.isRequired,
  bottomTeamScore: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  changeBracketProperty: PropTypes.func.isRequired,
  isEditable: PropTypes.bool.isRequired,
  eliminatedTeamIds: PropTypes.object.isRequired,
  bracketId: PropTypes.number
};

export default compose(withEthers, withStyles(styles))(FinalFour);
