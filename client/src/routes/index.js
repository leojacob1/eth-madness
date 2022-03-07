import React from 'react'
import {
  Route, Switch, BrowserRouter as Router,
} from 'react-router-dom'
import CreateBracket from '../containers/CreateBracket';
import ShowBracket from '../containers/ShowBracket';
import AdminContainer from '../containers/AdminContainer';
import LeaderboardContainer from '../containers/LeaderboardContainer';
import HomePage from '../components/HomePage';
import NavBar from '../components/NavBar';

/**
 * Main routes for the application.
 */
const routes = (
  <Router>
    <NavBar />

    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/bracket/:submitterAddress" component={ShowBracket} />
      <Route path="/leaders" component={LeaderboardContainer} />
      <Route path="/admin" component={AdminContainer} />
      <Route path="/enter" component={CreateBracket} />
    </Switch>
  </Router>
)

export default routes;
