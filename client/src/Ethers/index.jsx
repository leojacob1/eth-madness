import React from 'react';
import { ContractContext, withEthers } from './context';
import ethersProps from './ethers';

const EthersDom = () => (
  <div data-testid="ethers">
    <h1>Ethers</h1>
  </div>
);

export default ethersProps;

export { EthersDom, ContractContext, withEthers };