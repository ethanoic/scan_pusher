require('dotenv').config() ;
let mysql = require('mysql');
const { ethers } = require('ethers');
const Web3 = require('web3');
const ContractABI = require('./abi/RKPRIM.json');

const { 
  ALCHEMY_API_KEY, 
  ALCHEMY_WEB_SOCKET, 
  LISTEN_ADDRESS,
  MYSQL_HOST,
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_DB,
  MYSQL_TABLE,
  TRANSACTION_CONFIRMATION_MIN,
  TRANSACTION_CONFIRMATION_RETRY_INTERVAL
} = process.env;

let connection;

function validateTransaction(trx) {
  const toValid = trx.to !== null
  if (!toValid) return false
  
  const walletToValid = trx.to.toLowerCase() === LISTEN_ADDRESS.toLowerCase()

  return toValid && walletToValid;
}

/**
 * Calls the smart contract splitter
 */
const callSmartContract = (contractAddress) => {
  if (contractAddress === '' || contractAddress === null) {
    console.log('error, smart contract address empty');
    return;
  }

  const customHttpProvider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_KEY);
  const signer = customHttpProvider.getSigner();
  const contract = new ethers.Contract(
    contractAddress,
    ContractABI,
    signer
  );
  contract.distribute();
}

/**
 * 
 * @param {*} result 
 * 
 * Actions on confirmed transaction
 */
const actionOnConfirmedTransaction = (result) => {
  // get NFT public key from transaction
  const nftId = ''

  if (nftId === '' || nftId === null) {
    console.log('error NFT Id not found');
    return;
  }

  // query MySQL DB for contract address and artist address
  if (connection == undefined) {
    console.log('No DB connection available')
    return;
  }

  connection.query('SELECT smartContract, EthKey FROM ' + MYSQL_TABLE + ' WHERE TokenID = ?', 
    [nftId],
    (err, results, fields) => {
      if (err) {
        console.log(err.message)
      }
      
      if (results.length === 1) {
        const ethKey = results[0].EthKey; // not sure if i need this
        const smartContract = results[0].smartContract;
        callSmartContract(smartContract);
      }
    }
  );

}

async function getConfirmations(txHash) {
  try {
    // Instantiate web3 with HttpProvider
    const web3 = new Web3(ALCHEMY_API_KEY);

    // Get transaction details
    const trx = await web3.eth.getTransaction(txHash);

    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber();

    // When transaction is unconfirmed, its block number is null.
    // In this case we return 0 as number of confirmations
    return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
  }
  catch (error) {
    console.log(error)
  }
}

async function getTransactionReceipt(txHash) {
  try {
    // Instantiate web3 with HttpProvider
    const web3 = new Web3(ALCHEMY_API_KEY);

    const receipt = await web3.eth.getTransactionReceipt(txHash);
    
    return receipt.status;

  } catch (error) {
    console.log(error)
  }
}

function confirmTransaction(txHash, confirmations = TRANSACTION_CONFIRMATION_MIN) {
  setTimeout(async () => {
    
    /*
    // Get current number of confirmations and compare it with sought-for value
    const trxConfirmations = await getConfirmations(txHash)
    
    console.log('Transaction with hash ' + txHash + ' has ' + trxConfirmations + ' confirmation(s)')

    if (trxConfirmations >= confirmations) {
      // Handle confirmation event according to your business logic
      
      console.log('Transaction with hash ' + txHash + ' has been successfully confirmed')
      
      actionOnConfirmedTransaction(txHash);

      return;
    }
    */

    // get the transaction receipt, if status is TRUE, transaction is completed
    const status = await getTransactionReceipt(txHash);
    console.log('Transaction with hash ' + txHash + ' has ' + status + ' status')

    if (status) {
      // Handle confirmation event according to your business logic
      
      console.log('Transaction with hash ' + txHash + ' has been successfully confirmed')
      
      actionOnConfirmedTransaction(txHash);

      return;
    }

    // Recursive call
    return confirmTransaction(txHash, confirmations)
  }, TRANSACTION_CONFIRMATION_RETRY_INTERVAL * 1000)
}

const main = async () => {
  connection = mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB
  });

  connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  
    console.log('Connected to the MySQL server.', MYSQL_HOST);

    const web3 = new Web3(ALCHEMY_WEB_SOCKET);
    web3.eth.getBlockNumber().then(console.log);  // -> 7946893

    const web3Http = new Web3(ALCHEMY_API_KEY);

    var subscription = web3.eth.subscribe('pendingTransactions');

    subscription.subscribe(async (error, txHash) => {
      if (error) { 
        console.log('error', error) 
        return;
      }

      const trx = await web3Http.eth.getTransaction(txHash);

      const valid = validateTransaction(trx);
      // If transaction is not valid, simply return
      if (!valid) return

      console.log('Transaction hash is: ' + txHash + '\n');

      confirmTransaction(txHash);

      subscription.unsubscribe();
    })

  });

}

main();

console.log('press any key to exit')

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));