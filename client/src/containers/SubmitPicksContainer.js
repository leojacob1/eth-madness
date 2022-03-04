import { connect } from 'react-redux';
import * as Actions from '../actions';
import SubmitPicksDialog from '../components/SubmitPicksDialog';

const mapStateToProps = state => ({
  encodedPicks: state.picks.encodedPicks,
  location: state.router.location
});

const mapDispatchToProps = dispatch => ({
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubmitPicksDialog)
