# Scan Pusher

Listens for pending transactions on a given wallet and execute calling a contract address and methods

## Setup:

1. Clone the project to your local drive
2. run `npm i` to install dependecies
3. Duplicate `.env.example` to `.env`
4. Configure environment settings

  LISTEN_ADDRESS=wallet address to subscribe to
  ALCHEMY_API_KEY=alchemy api key
  ALCHEMY_WEB_SOCKET=alchemy web socket
  TRANSACTION_CONFIRMATION_MIN=min confirmation blocks required
  TRANSACTION_CONFIRMATION_RETRY_INTERVAL=seconds to retry confirmation check of the pending transaction
  DEPOSIT_WITHDRAW_BLOCK_WAIT=number of blocks to wait before calling withdraw
  SENTRY_DSN=your sentry DSN

  MYSQL_HOST=mysql database host
  MYSQL_USERNAME=mysql username
  MYSQL_PASSWORD=mysq lpassword
  MYSQL_DB=database name
  MYSQL_TABLE=table to query for artist smart contract

5. copy the latest contract ABI.abi property value into `./abi/RKPRIM.json`
6. run `npm run start` to start the pusher