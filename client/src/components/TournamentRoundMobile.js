import React, { Component, useContext } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import Game from './Game';
import { SubmitPicksContext, UserContext } from '../store/context';
import { compose } from 'recompose';
import { withEthers } from '../Ethers';

const styles = theme => {
  const result = {
    root: {
      padding: theme.spacing.unit * 2
    },
    game: {
      marginBottom: theme.spacing.unit * 2
    },
    score: {

    },
    finalScoreLabel: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    submitButton: {
      marginTop: theme.spacing.unit * 2,
      height: 70,
      fontSize: 20,
      // position: 'absolute',
      // left: theme.spacing.unit * 2,
      // bottom: theme.spacing.unit * 2,
      // width: `calc(100vw - ${theme.spacing.unit * 4}px)`
    },
    navButtons: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between'
    }
  };

  return result;
};

/**
 * Renders a 'Game' component for each game passed in the 'games' prop.
 */
const TournamentRoundMobile = (props) => {
  const submitPicksStore = useContext(SubmitPicksContext);

  const createGame = (game) => {
    const { makePick, isEditable, classes, eliminatedTeamIds } = props;

    const gameProps = {
      key: game.gameId, gameId: game.gameId, topSlotId: game.topSlotId,
      bottomSlotId: game.bottomSlotId, currentPickSlotId: game.currentPickSlotId,
      topTeam: game.topTeam, bottomTeam: game.bottomTeam, eliminatedTeamIds,
      classes: { root: classes.game }, gameResult: game.gameResult
    };

    return (<Game {...gameProps} makePick={makePick} isEditable={isEditable} />);
  }

  const submitPicks = () => {
    const { encodedPicks, topTeamScore, bottomTeamScore, message } = props;
    console.log('tourney round', props.ethersProps.ethMadnessContract)
    submitPicksStore.submitPicks(props.ethersProps.ethMadnessContract, encodedPicks, parseInt(topTeamScore), parseInt(bottomTeamScore), message);
  }

  const getFinalsComponent = () => {
    const { classes, games, message, submitEnabled, topTeamScore, bottomTeamScore, isEditable, changeBracketProperty } = props;
    return (
      <div className={classes.root}>
        {createGame(games[0])}
        <Grid container justify="center">
          <Grid item xs={4}>
            {
              isEditable ?
                (
                  <TextField
                    className={classes.score}
                    variant="outlined"
                    helperText="Winner Score"
                    margin="dense"
                    value={topTeamScore}
                    onChange={(event) => changeBracketProperty('teamA', event.target.value)}
                  />)
                :
                (
                  [<Typography key="score" align="center" variant="h4">{topTeamScore}</Typography>,
                  <Typography key="label" align="center" >Winner Score</Typography>]
                )
            }
          </Grid>
          <Grid item xs={4} className={classes.finalScoreLabel}>
            <Typography align="center" variant="caption">Final<br />Score</Typography>
          </Grid>
          <Grid item xs={4}>
            {
              isEditable ?
                (
                  <TextField
                    className={classes.score}
                    variant="outlined"
                    helperText="Loser Score"
                    margin="dense"
                    value={bottomTeamScore}
                    onChange={(event) => changeBracketProperty('teamB', event.target.value)}
                  />)
                :
                (
                  [<Typography key="score" align="center" variant="h4">{bottomTeamScore}</Typography>,
                  <Typography key="label" align="center">Loser Score</Typography>]
                )
            }
          </Grid>
          <Grid item xs={12}>
            {
              isEditable ?
                (
                  <TextField
                    variant="outlined"
                    helperText="Bracket Name (Optional)"
                    margin="dense"
                    fullWidth
                    value={message}
                    onChange={(event) => changeBracketProperty('bracketName', event.target.value)}
                  />)
                :
                null
            }
          </Grid>
          {isEditable &&
            <Grid item xs={12}>
              <Button className={classes.submitButton} color="primary" fullWidth variant="contained" disabled={!submitEnabled || !submitPicksStore.userAddress} onClick={() => submitPicks()} >Submit Bracket</Button>
            </Grid>
          }
        </Grid>
      </div>
    );
  }

  const { games, classes, isFinals, nextButtonName, nextButtonAction, prevButtonName, prevButtonAction, } = props;
  if (isFinals) {
    return getFinalsComponent();
  } else {
    const prevButton = prevButtonName ? ([<KeyboardArrowLeft />, prevButtonName]) : undefined;
    const nextButton = nextButtonName ? ([nextButtonName, <KeyboardArrowRight />]) : undefined;
    return (
      <div className={classes.root}>
        {games.map(g => createGame(g))}
        <div className={classes.navButtons}>
          <Button onClick={prevButtonAction}>{prevButton}</Button>
          <Button onClick={nextButtonAction}>{nextButton}</Button>
        </div>
      </div>
    );
  }
}

TournamentRoundMobile.propTypes = {
  classes: PropTypes.object.isRequired,
  games: PropTypes.array.isRequired,
  makePick: PropTypes.func.isRequired,
  isEditable: PropTypes.bool.isRequired,

  isFinals: PropTypes.bool.isRequired,
  submitEnabled: PropTypes.bool.isRequired,
  encodedPicks: PropTypes.string,
  topTeamScore: PropTypes.string.isRequired,
  bottomTeamScore: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  changeBracketProperty: PropTypes.func.isRequired,

  nextButtonName: PropTypes.string.isRequired,
  nextButtonAction: PropTypes.func.isRequired,
  prevButtonName: PropTypes.string.isRequired,
  prevButtonAction: PropTypes.func.isRequired,

  eliminatedTeamIds: PropTypes.object.isRequired
};

export default compose(withEthers, withStyles(styles))(TournamentRoundMobile);
