require('dotenv').config() ;
const { ALCHEMY_API_KEY, CONTRACT_ADDRESS, WALLET } = process.env;

const https = require('https');
const { ethers } = require('ethers');
const ContractABI = require('./contracts/RKPRIM.json');

let lastBlock = 1;
let contract = null;

console.log(`starting scan_pusher wallet: ${WALLET}`)

const httpsGet = async (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = [];
      console.log('Status Code:', res.statusCode);

      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', () => {
        console.log('Response ended: ');
        console.log(JSON.parse(Buffer.concat(data).toString()));
        resolve(JSON.parse(Buffer.concat(data).toString()))
      });

    }).on('error', err => {
      console.log('Error: ', err.message);
      reject(err);
    });
  });
}

const getBalance = () => {
  // todo - replace with alchemy to get that contract balance
  
}

const getTransactions = () => {
  const result = httpsGet(`https://api.polygonscan.com/api?module=account&action=txlist&address=${WALLET}&startblock=${lastBlock}&endblock=99999999&sort=asc&apikey=${POLYGON_API_KEY}`)
  
  result.then(
    (response) => {
      console.log(response.result);
    }, () => {
      console.log('error')
    });
}

const getLastBlockAccess = () => {
  
}

const updateLastBlockAccess = () => {

}

const getArtistNFT = (tx) => {
  // get from tx extra data, meta somewhere
  // artist id, each artist splittng contract is different
  // search by public key, token id
}

// when nft is listed for sale, non minted wallet
const callSplitterContract = () => {
  // need contractABI and contract address, 
  // parameters: company B address (godkey D72), amount
}

// run this every 23:59 UTC
// get transactions from last block access onwards
// iterate for each transaction, if artist id / nft contract id is in database

const main = async () => {
  const customHttpProvider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_KEY);
  
  const signer = customHttpProvider.getSigner();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ContractABI,
    signer
  );

  const balance = ethers.utils.formatEther(await customHttpProvider.getBalance(CONTRACT_ADDRESS))

  console.log('contract balance', balance);

  // listen for events
  
}

main();
