import { ethers } from 'ethers';
import EthMadness from '../contracts/EthMadness.json';
const ethMadnessContractAddress = "0x4bae425ad91eeeefbebb80d8ae8cd2c467e41b47";
const provider = new ethers.providers.Web3Provider(window.ethereum);
let ethMadnessContract = new ethers.Contract(ethMadnessContractAddress, EthMadness.abi, provider);
const signer = provider.getSigner();
ethMadnessContract = ethMadnessContract.connect(signer);
const ethersProps = { ethMadnessContract, provider };
export default ethersProps;