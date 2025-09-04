import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { compact } from "lodash";

type Wallet = {
  publicKey: PublicKey;
  privateKey: string;
};

const UNIT_PRICE_DEFAULT = 100_000;
const CCU_LIMIT = 200_000;

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = 58;

const ALPHABET_MAP = () => {
  const result = {};
  for (let i = 0; i < ALPHABET.length; i++) {
    //@ts-expect-error abc
    result[ALPHABET.charAt(i)] = i;
  }
  return result as { [key: string]: number };
};

const decode = (string: string) => {
  if (string.length === 0) return [];

  let i, j;
  const bytes: number[] = [0];
  const alphabetMap = ALPHABET_MAP();
  console.log("🚀 ~ decode ~ alphabetMap:", alphabetMap);
  for (i = 0; i < string.length; i++) {
    const c = string[i];
    if (!(c in alphabetMap)) throw new Error("Non-base58 character");

    for (j = 0; j < bytes.length; j++) bytes[j] *= BASE;
    bytes[0] += alphabetMap[c];

    let carry = 0;
    for (j = 0; j < bytes.length; ++j) {
      bytes[j] += carry;

      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }

    while (carry) {
      bytes.push(carry & 0xff);

      carry >>= 8;
    }
  }

  for (i = 0; string[i] === "1" && i < string.length - 1; i++) bytes.push(0);

  return bytes.reverse();
};

const genOwner = (privateKey: string): Keypair => {
  const stringDecoded = decode(privateKey as string);
  return Keypair.fromSecretKey(Uint8Array.from(stringDecoded as []), {
    skipValidation: false,
  });
};

const getGasPrice = async (connection: Connection): Promise<number> => {
  const buffNum = 100;
  try {
    return await new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        resolve(UNIT_PRICE_DEFAULT * buffNum);
      }, 2000);
      const getPriority = await connection.getRecentPrioritizationFees();
      const currentFee = getPriority
        .filter((fee) => fee?.prioritizationFee > 0)
        .map((fee) => fee?.prioritizationFee);
      clearTimeout(timeout);
      const unitPrice =
        currentFee.length > 0
          ? Math.max(...currentFee, UNIT_PRICE_DEFAULT)
          : UNIT_PRICE_DEFAULT;
      resolve(unitPrice * buffNum);
    });
  } catch (err) {
    console.log("🚀 ~ getGasPrice ~ err:", err);
    return UNIT_PRICE_DEFAULT * buffNum;
  }
};

export const postBaseSendTxs = async (
  insTransaction: TransactionInstruction[],
  wallet: Wallet,
  connection: Connection,
  txOption?: { microLamports?: number; ccuLimit?: number }
): Promise<string> => {
  try {
    const signer = genOwner(wallet.privateKey);
    const { blockhash } = await connection.getLatestBlockhash();

    const instructions = compact(insTransaction);
    // const computeBudgetLimit = ComputeBudgetProgram.setComputeUnitLimit({
    //   units: txOption?.ccuLimit ?? CCU_LIMIT,
    // });

    // let unitSPrice = txOption?.microLamports;
    // if (!unitSPrice) {
    //   unitSPrice = await getGasPrice(connection).catch(() => undefined);
    // }

    // const unitPrice = Math.max(Number(unitSPrice) ?? 0, UNIT_PRICE_DEFAULT * 1);
    // const transactionFeePriorityInstruction = ComputeBudgetProgram.setComputeUnitPrice(
    //   {
    //     microLamports: unitPrice,
    //   }
    // );

    // instructions.unshift(transactionFeePriorityInstruction);
    // instructions.unshift(computeBudgetLimit);

    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transactions = new VersionedTransaction(messageV0);

    // const simulate = await connection.simulateTransaction(transactions);

    // if (simulate.value.err) {
    //   console.log("🚀 ~ postBaseSendTxs ~ simulate:", simulate);
    //   throw new Error("Transaction failed");
    // }

    transactions.sign([signer]);

    const hash = await connection.sendTransaction(transactions, {
      skipPreflight: false,
    });
    console.log("🚀 ~ postBaseSendTxs ~ hash:", hash)

    return hash;
  } catch (error) {
    if (typeof error === "string") {
      throw new Error(error);
    } else if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("@wallet/solana: unknown error");
    }
  }
};

export async function checkTransactionFinalized(
  connection: Connection,
  txHash: string[],
  retryDelay: number = 2000
): Promise<{ [txHash: string]: boolean }> {
  try {
    const { value } = await connection.getSignatureStatuses(txHash, {
      searchTransactionHistory: true
    })

    const results: { [txHash: string]: boolean } = {}
    const pendingTxs: string[] = []

    value.forEach((status, index) => {
      const tx = txHash[index]
      if (status?.confirmationStatus === 'finalized') {
        results[tx] = true // Transaction đã finalized
      } else if (status?.err) {
        throw new Error(`Transaction ${tx} failed: ${JSON.stringify(status)}`)
      } else {
        pendingTxs.push(tx)
        results[tx] = false
      }
    })

    if (pendingTxs.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      const retryResults = await checkTransactionFinalized(
        connection,
        pendingTxs,
        retryDelay
      )
      Object.assign(results, retryResults)
    }

    return results
  } catch (error: any) {
    if (error.message.includes('block height exceeded')) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return checkTransactionFinalized(connection, txHash, retryDelay)
    }
    throw error // Ném lỗi nếu không phải lỗi block height hoặc hết lượt retry
  }
}