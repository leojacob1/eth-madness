import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import ViewEntry from './ViewEntry';
import { withEthers } from '../Ethers';
import { SubmitPicksContext } from '../store/context';

/**
 * Simple spinner, triggers a passed load action.
 */
const LoadingContainer = (props) => {
  const { isLoading, realProps, loadAction } = props;
  console.log('loading container')
  if (isLoading) {
    // Trigger the load action, this shouldn't trigger one if one is already in progress
    loadAction(props.ethersProps);
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
        <CircularProgress />
      </div>
    );
  }

  return (<ViewEntry {...realProps} />);
}

LoadingContainer.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  loadAction: PropTypes.func.isRequired,
  realProps: PropTypes.object.isRequired,
};

export default withEthers(LoadingContainer);