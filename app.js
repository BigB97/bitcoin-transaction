const axios = require("axios");
const bitcore = require("bitcore-lib");

/** 
  @receiverAddress - Address of the person you want to send bitcoin to
  @amountToSend - This is the amount of bitcoin you want to send to someone from your wallet. This amount will be deducted from your wallet and sent to this address.
*/

let sendBitcoin = async (recieverAddress, amountToSend) => {
  const sochain_network = "BTCTEST"; // the Testnet network for sochain
  const privateKey = `926ysJQabYsB2CxQLZnzcDKp5iExgCRy1MyYeFHYDBQLEvT1QzV `; // your privateKey -- the one we just generated
  /* your bitcoin address. The one you want to send funds from -- the one we just generated */
  const sourceAddress = `mgNiM9VEpDGRgGPP5z6MawkX4XTVkAnUWb`;
  /**
  because the outputs come in satoshis, and 1 Bitcoin is equal to 100,000,000 satoshies, we'll multiply the amount of bitcoin by 100,000,000 to get the value in satoshis.
  */

  const satoshiToSend = amountToSend * 100000000;
  let inputCount = 0;
  let outputCount = 2; // we are going to use 2 as the output count because we'll only send the bitcoin to 2 addresses the receiver's address and our change address.

  const utxos = await axios.get(
    `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
  );
  const transaction = new bitcore.Transaction();

  let totalAmountAvailable = 0;
  let inputs = [];
  // console.log(utxos.data);

  utxos.data.data.txs.forEach(async (element) => {
    let utxo = {};
    utxo.satoshis = Math.floor(Number(element.value) * 100000000);
    utxo.script = element.script_hex;
    utxo.address = utxos.data.data.address;
    utxo.txId = element.txid;
    utxo.outputIndex = element.output_no;
    totalAmountAvailable += utxo.satoshis;
    inputCount += 1;
    inputs.push(utxo);
  });
  const transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
  // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

  const fee = Math.ceil(transactionSize / 1000) * 20;
  console.log({ fee });

  if (totalAmountAvailable - satoshiToSend - fee < 0) {
    return "Insufficient funds";
  }

  // transaction from the source address to the receiver address
  transaction.from(inputs);

  // set the recieving address and the amount to send
  transaction.to(recieverAddress, satoshiToSend);

  // Set change address - Address to receive the left over funds after transfer
  transaction.change(sourceAddress);

  //manually set transaction fees: 20 satoshis per byte
  transaction.fee(fee * 20);

  // Sign transaction with your private key
  transaction.sign(privateKey);

  // serialize Transactions
  const serializedTransaction = transaction.serialize();

  // Send transaction
  const result = await axios({
    method: "POST",
    url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
    data: {
      tx_hex: serializedTX,
    },
  });

  return result.data.data;
};

module.exports = sendBitcoin;
