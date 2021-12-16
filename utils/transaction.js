/**
 * Get transaction for NFT and extracts the tokenId
 */

const Web3 = require('web3');

const main = async () => {
  
  const web3 = new Web3('https://polygon-mainnet.g.alchemy.com/v2/6JlxRqG6Hhcm2ZE7yYitg1_Zgi-RgJHA')
  const trx = await web3.eth.getTransactionReceipt('0x740039a1213f36b3120c81d7d7bdf93fd35ce0de8b17c1d51088efc61ffbc7dc');

  const logs = trx.logs;
  console.log(logs);
  console.log('Token Id', web3.utils.toBN(logs[0].topics[3]).toString());
}

main();