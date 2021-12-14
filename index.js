const https = require('https');
const Web3 = require('web3');

require('dotenv').config() ;

const { POLYGON_API_KEY, WALLET } = process.env;
console.log(process.env)

const lastBlock = '';

console.log(`starting scan_pusher wallet: ${WALLET}`)

const getBalance = () => {
  https.get(`https://api.polygonscan.com/api?module=account&action=balance&address=${WALLET}&tag=latest&apikey=${POLYGON_API_KEY}`, res => {
    let data = [];
    const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
    console.log('Status Code:', res.statusCode);
    console.log('Date in Response header:', headerDate);

    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      console.log('Response ended: ');
      console.log(JSON.parse(Buffer.concat(data).toString()).result);

      const { status, result } = JSON.parse(Buffer.concat(data).toString());

      if (status === '1') {
        console.log(result);
      }
    });
  }).on('error', err => {
    console.log('Error: ', err.message);
  });

}

const getTransactions = () => {

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

getBalance(); // testing