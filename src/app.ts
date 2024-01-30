import {Connection, Commitment, PublicKey} from '@solana/web3.js'
import 'dotenv/config'
import * as fsPromise from 'fs/promises'

// Override this with your own RPC url or put it in an .env file.
let rpcEndpoint = process.env.RPC_URL as string
const conn = new Connection(rpcEndpoint, {commitment: 'finalized' as Commitment});

// Function taken from https://codereview.stackexchange.com/questions/184459/getting-the-date-in-yyyymmdd-format
function yyyymmdd() {
  var x = new Date();
  var y = x.getFullYear().toString();
  var m = (x.getMonth() + 1).toString();
  var d = x.getDate().toString();
  (d.length == 1) && (d = '0' + d);
  (m.length == 1) && (m = '0' + m);
  var yyyymmdd = y + m + d;
  return yyyymmdd;
}

const collectionName = ""

/*
This method is old school before DAS existed, if you want newer methods some examples
can be located https://www.helius.dev/blog/nft-holder-snapshots
*/
const main = async () => {
  // NOTE: This will be your hashlist if used elsewhere.
  let nfts = require(`../${collectionName}.json`)
  let currentNumber = 1
  const date = yyyymmdd()
  for await (const nft of nfts) {
    // @ts-ignore
    console.log(nft)
    console.log(`${currentNumber}/${nfts.length}`)
    const mintToken = nft
    currentNumber = currentNumber + 1
    try {
      const largestAccounts = await conn.getTokenLargestAccounts(new PublicKey(mintToken))
      const largestAccountInfo = await conn.getParsedAccountInfo(largestAccounts.value[0].address)
      // @ts-ignore
      const owner = largestAccountInfo.value.data.parsed.info.owner;
      // @ts-ignore
      const details = largestAccountInfo.value.data.parsed
      
      const json = {
        "NFTAddress": mintToken as unknown as Text,
        "ownerAddress": owner as unknown as Text
      }

      await fsPromise.appendFile(`../${collectionName}_${date}.json`, json)
      // Can add a setTimeout so you're not spamming the RPCs
      continue
    } catch (e) {
      console.error(e)
      continue
    }
  }
}

main()