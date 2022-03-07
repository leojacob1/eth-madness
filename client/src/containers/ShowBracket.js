import { connect } from 'react-redux';
import * as Actions from '../actions';
import LoadingContainer from '../components/LoadingContainer';
import ViewEntry from '../components/ViewEntry';



const mapStateToProps = state => {
  const resultsByGameId = state.leaderboard.resultsByGameId;
  return ({
    numRounds: state.games.numRounds,
    submitEnabled: !!state.picks.encodedPicks && state.picks.teamAScore > 0 && state.picks.teamBScore > 0,
    encodedPicks: state.picks.encodedPicks,
    topTeamScore: state.picks.teamAScore,
    bottomTeamScore: state.picks.teamBScore,
    message: state.picks.bracketName,
    games: state.games.games.map(game => ({
      gameId: game.gameId,
      region: game.region,
      topSlotId: game.topSlotId,
      bottomSlotId: game.bottomSlotId,
      round: game.round,
      topTeam: state.teams.teamsById[state.picks.currentBracketByGameId[game.gameId].topTeamId],
      bottomTeam: state.teams.teamsById[state.picks.currentBracketByGameId[game.gameId].bottomTeamId],
      currentPickSlotId: state.picks.picksByGameId[game.gameId] && state.picks.picksByGameId[game.gameId].slotId,
      // gameResult: resultsByGameId[game.gameId]
    }))
  })
};

const mapDispatchToProps = dispatch => ({
  makePick: (gameId, teamId, slotId) => dispatch(Actions.pickGame(gameId, teamId, slotId)),
  makeRandomPicks: () => dispatch(Actions.makeRandomPicks()),
  clearPicks: () => dispatch(Actions.clearPicks()),
  perfectPicks: () => dispatch(Actions.perfectPicks()),
  topSeedPicks: () => dispatch(Actions.topSeedPicks()),
  changeBracketProperty: (propertyName, value) => dispatch(Actions.changeBracketProperty(propertyName, value))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewEntry)

