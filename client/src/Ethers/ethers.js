import { ethers } from 'ethers';
import EthMadness from '../contracts/EthMadness.json';
import ethMadnessContractAddress from './ethMadnessContractAddress';
const provider = new ethers.providers.Web3Provider(window.ethereum);
let ethMadnessContract = new ethers.Contract(ethMadnessContractAddress, EthMadness.abi, provider);
const signer = provider.getSigner();
ethMadnessContract = ethMadnessContract.connect(signer);
const ethersProps = { ethMadnessContract, provider };
export default ethersProps;