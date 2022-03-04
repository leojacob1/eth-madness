import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import navigation from './navigation';
import games from './games';
import teams from './teams';
import picks from './picks';
import contract from './contract';
import leaderboard from './leaderboard';

export default (history) => combineReducers({
  navigation,
  teams,
  games,
  contract,
  picks,
  leaderboard,
  router: connectRouter(history)
});
