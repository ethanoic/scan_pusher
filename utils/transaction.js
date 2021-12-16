/**
 * Get transaction for NFT and extracts the tokenId
 */

const Web3 = require('web3');

const main = async () => {
  
  const txHash = '0xbfd8bbea701beaf2108fd1e3e6c98b4e6005fa47c8d9c1100585eb03d180beb0';

  const web3 = new Web3('http://127.0.0.1:8545')
  const tx = await web3.eth.getTransaction(txHash);
  
  console.log(tx);

  const txReceipt = await web3.eth.getTransactionReceipt(txHash);

  console.log(txReceipt);

  const logs = txReceipt.logs;
  console.log(logs);
  console.log('Token Id', web3.utils.toBN(logs[0].topics[3]).toString());
}

main();