import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
// import { AppContainer } from 'react-hot-loader';
import configureStore, { history } from './store/configureStore';
import App from './components/App'
import SubmitPicksStore from './store/submitPicksStore';
import { SubmitPicksContext, UserContext } from './store/context';
import ethersProps, { ContractContext } from './Ethers';

const store = configureStore();
const rootEl = document.getElementById('root');


const doRender = Component => {
  render(
    <Provider store={store}>
      <ContractContext.Provider value={ethersProps}>
        <SubmitPicksContext.Provider value={new SubmitPicksStore()}>
          <Component history={history} />
        </SubmitPicksContext.Provider>
      </ContractContext.Provider>
    </Provider>,
    rootEl
  );
}

doRender(App);

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default;
    render(NextApp);
  });
}