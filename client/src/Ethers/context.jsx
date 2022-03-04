import React from 'react';

const ContractContext = React.createContext(null);

const withEthers = (Component) => (props) => (
  <ContractContext.Consumer>
    {(ethersProps) => <Component {...props} ethersProps={ethersProps} />}
  </ContractContext.Consumer>
);

export { ContractContext, withEthers };
