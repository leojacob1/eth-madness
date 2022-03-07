import React, { Component, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles, Typography, Hidden } from '@material-ui/core';
import Bracket from './Bracket';
import BracketMobile from './BracketMobile';
import { useParams } from 'react-router-dom';
import { compose } from 'recompose';
import { withEthers } from '../Ethers';

const styles = theme => ({
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  bracket: {
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing.unit
    },
    marginTop: -30
  },
  titleBar: {
    width: '100%',
    maxWidth: '100%',
    paddingTop: theme.spacing.unit,
    height: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  subheader: {
    display: 'flex',
    justifyContent: 'space-evenly',
    maxWidth: 700
  },
  title: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    maxWidth: '100%',
  }
});

/**
 * Shows a submitted and filled out bracket entry which is not editable.
 */
const ViewEntry = (props) => {
  console.log('view entry!', props.games);
  const { transactionHash, games, classes, makePick, numRounds, submitEnabled,
    topTeamScore, bottomTeamScore, message, changeBracketProperty, eliminatedTeamIds, bracketScore, bracketId } = props;
  const [encodedPicks, setEncodedPicks] = useState();
  const { submitterAddress } = useParams();


  const getBracket = async () => {
    console.log('leggo')
    console.log(submitterAddress);
    const entries = await props.ethersProps.ethMadnessContract.entries(submitterAddress);
    console.log(entries);
  }

  useEffect(getBracket, []);

  if (!encodedPicks) {
    return (<p>Loading</p>);
  }
  return (
    <div className={classes.root}>
      <div className={classes.titleBar}>
        <Typography className={classes.title} align="center" variant="h5">{ }</Typography>
        <div className={classes.subheader} >
          <Typography className={classes.title} align="center" variant="h6"><span>Score: {bracketScore}</span></Typography>
          <Typography className={classes.title} align="center" variant="h6"><span>
            <a href={`https://etherscan.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">
              View Tx
            </a></span>
          </Typography>
        </div>
      </div>
      <Hidden smDown>
        <Bracket
          classes={{ root: classes.bracket }}
          games={games}
          makePick={makePick}
          numRounds={numRounds}
          submitEnabled={submitEnabled}
          encodedPicks={encodedPicks}
          topTeamScore={topTeamScore}
          bottomTeamScore={bottomTeamScore}
          message={message}
          changeBracketProperty={changeBracketProperty}
          isEditable={false}
          eliminatedTeamIds={{}} // eliminatedTeamIds
          bracketId={bracketId}
        />
      </Hidden>
      <Hidden mdUp>
        <BracketMobile
          classes={{ root: classes.bracket }}
          games={games}
          makePick={makePick}
          numRounds={numRounds}
          submitEnabled={submitEnabled}
          encodedPicks={encodedPicks}
          topTeamScore={topTeamScore}
          bottomTeamScore={bottomTeamScore}
          message={message}
          changeBracketProperty={changeBracketProperty}
          isEditable={false}
          eliminatedTeamIds={{}} // eliminatedTeamIds
        />
      </Hidden>
    </div>
  );
}

ViewEntry.propTypes = {
  classes: PropTypes.object.isRequired,
  numRounds: PropTypes.number.isRequired,
  games: PropTypes.array.isRequired,
  topTeamScore: PropTypes.string.isRequired,
  bottomTeamScore: PropTypes.string.isRequired,
  bracketScore: PropTypes.number.isRequired,
  submitter: PropTypes.string.isRequired,
  transactionHash: PropTypes.string.isRequired,
  eliminatedTeamIds: PropTypes.object.isRequired,
  bracketId: PropTypes.number.isRequired
};

export default compose(withEthers, withStyles(styles))(ViewEntry);
