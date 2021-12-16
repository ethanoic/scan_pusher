require('dotenv').config() ;
const ethers = require("ethers");
const ContractABI = require('../abi/RKPRIM.json');
/**
 * test to call a contract
 */
const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_API_KEY);
  const wsProvider = new ethers.providers.WebSocketProvider(process.env.ALCHEMY_WEB_SOCKET);

  const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    contractAddress,
    ContractABI,
    signer
  );

  console.log(ethers.BigNumber.from(await contract.totalFundsDistributed()).toString());

  console.log(await contract.distribute());

  console.log(await contract.withdraw());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });