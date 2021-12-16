require('dotenv').config() ;
const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: "https://44d604aa410c4cd1a5d31f1689555792@o247622.ingest.sentry.io/6109731",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

let mysql = require('mysql');
const { ethers } = require('ethers');
const Web3 = require('web3');
const ContractABI = require('./abi/RKPRIM.json');
const process = require('process');
const log = require('log-to-file');

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
  TRANSACTION_CONFIRMATION_RETRY_INTERVAL,
  DEPOSIT_WITHDRAW_BLOCK_WAIT
} = process.env;

let connection;
let web3Http;

function validateTransaction(trx) {
  const toValid = trx.to !== null
  if (!toValid) return false
  
  const walletToValid = trx.to.toLowerCase() === LISTEN_ADDRESS.toLowerCase()

  return toValid && walletToValid;
}

/**
 * Calls the smart contract splitter
 */
const callSmartContract = async (contractAddress) => {
  const transaction = Sentry.startTransaction({
    op: "callSmartContract",
    name: "Trigger smart contract",
  });

  try {
      
    if (contractAddress === '' || contractAddress === null) {
      throw 'error, smart contract address empty';
      return;
    }

    const customHttpProvider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_KEY);
    const signer = customHttpProvider.getSigner();
    const contract = new ethers.Contract(
      contractAddress,
      ContractABI,
      signer
    );
    
    const tx = await contract.distribute();

    const blockNumber = tx.blockNumber;
    
    // wait for distribute to complete after n blocks
    const intId = setInterval(async () => {
      const currentBlock = await web3Http.eth.getBlockNumber();

      if (currentBlock - blockNumber >= DEPOSIT_WITHDRAW_BLOCK_WAIT) {
        clearInterval(intId);
        await contract.withdraw();
      }
    }, 30 * 1000);
    
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}

/**
 * 
 * @param {*} result 
 * 
 * Actions on confirmed transaction
 */
const actionOnConfirmedTransaction = (txReceipt) => {
  const transaction = Sentry.startTransaction({
    op: "actionOnConfirmedTransaction",
    name: "action on transaction receipt",
  });

  try {
    const logs = txReceipt.logs;

    if (logs.length == 0) {
      console.log('error - tx logs is empty')
      throw txReceipt.hash + ' tx logs is empty'
      return;
    }

    if (logs[0].topics.length >= 3) {
      console.log('error - tx topics insufficient')
      throw txReceipt.hash + ' tx topics insufficient'
      return;
    }

    const nftId = web3Http.utils.toBN(logs[0].topics[3]).toString();
    
    if (nftId === '' || nftId === null) {
      console.log('error NFT Id not found');
      throw 'NFT Id not found'
      return;
    }

    // query MySQL DB for contract address and artist address
    if (connection == undefined) {
      console.log('No DB connection available')
      throw 'DB connection available'
      return;
    }

    connection.query('SELECT smartContract FROM ' + MYSQL_TABLE + ' WHERE TokenID = ?', 
      [nftId],
      (err, results, fields) => {
        if (err) {
          console.log(err.message)
          throw err.message
        }
        
        if (results.length === 1) {
          const smartContract = results[0].smartContract;
          callSmartContract(smartContract);
        }
      }
    );
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}

async function getConfirmations(txHash) {
  try {
    // Get transaction details
    const trx = await web3Http.eth.getTransaction(txHash);

    // Get current block number
    const currentBlock = await web3Http.eth.getBlockNumber();

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
    return await web3Http.getTransactionReceipt(txHash);
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
    const receipt = await getTransactionReceipt(txHash);
    const status = receipt.status;
    console.log('Transaction with hash ' + txHash + ' has ' + status + ' status')

    if (status) {
      // Handle confirmation event according to your business logic
      
      console.log('Transaction with hash ' + txHash + ' has been successfully confirmed')
      log(txHash + ' confirmed');
      
      actionOnConfirmedTransaction(receipt);

      return;
    }

    // Recursive call
    return confirmTransaction(txHash, confirmations)
  }, TRANSACTION_CONFIRMATION_RETRY_INTERVAL * 1000)
}

const main = async () => {
  log('started');
  const transaction = Sentry.startTransaction({
    op: "main",
    name: "starting main code",
  });

  try {
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
  
      web3Http = new ethers.providers.JsonRpcProvider(ALCHEMY_API_KEY);
      const wsProvider = new ethers.providers.WebSocketProvider(ALCHEMY_WEB_SOCKET);
      var subscription = wsProvider.on('pending', async (txHash) => {
        const trx = await web3Http.getTransaction(txHash);
  
        const valid = validateTransaction(trx);
        // If transaction is not valid, simply return
        if (!valid) return
  
        console.log('Transaction hash is: ' + txHash + '\n');
        log(txHash + ' pending');
  
        confirmTransaction(txHash);
      })
  
    });
  
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}

main();

process.on('beforeExit', () => {
  connection.destroy();
  log('exit');
})

console.log('press any key to exit')

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));