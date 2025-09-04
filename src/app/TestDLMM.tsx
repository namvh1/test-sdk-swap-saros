// "use client";
// import {
//   createUniformDistribution,
//   findPosition,
//   getBinRange,
//   getMaxBinArray,
//   getMaxPosition,
//   LiquidityBookServices,
//   LiquidityShape,
//   MODE,
// } from "@saros-finance/dlmm-sdk";
// import React from "react";
// import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
// import { checkTransactionFinalized, postBaseSendTxs } from "../../utils";
// import { convertBalanceToWei } from "@saros-finance/sdk/src/functions";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// const 
// const poolAddress = "HM9XRfj4PeBSNd7XS1BJVMQBpjJGygusZ8KE498wXZwH";

// const YOUR_WALLET = "GCn5MPQ4NX9eEQJUXZiAru4FsgTv4WUfL213WE5EoVYY";

// // Pool example on saros C98 to USDC
// const USDC_TOKEN = {
//   id: "usd-coin",
//   mintAddress: "So11111111111111111111111111111111111111112",
//   symbol: "usdc",
//   name: "USD Coin",
//   decimals: 6,
//   addressSPL: "FXRiEosEvHnpc3XZY1NS7an2PB1SunnYW1f5zppYhXb3",
// };

// const C98_TOKEN = {
//   id: "coin98",
//   mintAddress: "mntCAkd76nKSVTYxwu8qwQnhPcEE9JyEbgW6eEpwr1N",
//   symbol: "C98",
//   name: "Coin98",
//   decimals: 6,
//   addressSPL: "EKCdCBjfQ6t5FBfDC2zvmr27PgfVVZU37C8LUE4UenKb",
// };

// //C8xWcMpzqetpxwLj7tJfSQ6J8Juh1wHFdT5KrkwdYPQB

// const POOL_PARAMS = {
//   address: "C8xWcMpzqetpxwLj7tJfSQ6J8Juh1wHFdT5KrkwdYPQB",
//   baseToken: C98_TOKEN,
//   quoteToken: USDC_TOKEN,
//   slippage: 0.5,
//   hook: "", // config for reward, adding later
// };

// const liquidityBookServices = new LiquidityBookServices({
//   mode: MODE.DEVNET,
//   options: {
//     rpcUrl:
//       "https://solana-devnet.g.alchemy.com/v2/fjN9U3ARFyvCUDtSAGzaLmGGdAX_mYxK",
//     commitmentOrConfig: {
//       commitment: "confirmed",
//       httpHeaders: {
//         development: "coin98",
//       },
//     },
//   },
// });

// const wallet = {
//   publicKey: new PublicKey(YOUR_WALLET),
//   privateKey:
//     "",
// };

// const TestDLMM = () => {
//   const onSwap = async () => {
//     const getPoolInfo = await liquidityBookServices.getPairAccount(
//       new PublicKey(POOL_PARAMS.address)
//     );

//     const amountFrom = 1e6; // Token C98
//     const quoteData = await liquidityBookServices.getQuote({
//       amount: BigInt(amountFrom),
//       isExactInput: true, // input amount in
//       swapForY: true, // swap from C98 to USDC
//       pair: new PublicKey(POOL_PARAMS.address),
//       tokenBase: new PublicKey(POOL_PARAMS.baseToken.mintAddress),
//       tokenQuote: new PublicKey(POOL_PARAMS.quoteToken.mintAddress),
//       tokenBaseDecimal: POOL_PARAMS.baseToken.decimals,
//       tokenQuoteDecimal: POOL_PARAMS.quoteToken.decimals,
//       slippage: POOL_PARAMS.slippage,
//     });
//     console.log("🚀 ~ onSwap ~ quoteData:", quoteData);

//     const { amountIn, amountOut, priceImpact, amount, otherAmountOffset } =
//       quoteData; // slippage included

//     console.log(liquidityBookServices.hooksConfig);

//     const transaction = await liquidityBookServices.swap({
//       amount,
//       tokenMintX: new PublicKey(POOL_PARAMS.baseToken.mintAddress),
//       tokenMintY: new PublicKey(POOL_PARAMS.quoteToken.mintAddress),
//       otherAmountOffset,
//       hook: new PublicKey(liquidityBookServices.hooksConfig), // Optional, if you have a hook for reward
//       isExactInput: true, // input amount in
//       swapForY: true, // swap from C98 to USDC
//       pair: new PublicKey(POOL_PARAMS.address),
//       payer: new PublicKey(YOUR_WALLET), // Replace with your wallet public key
//     });
//     console.log("🚀 ~ onSwap ~ transaction:", transaction);

//     const hash = await postBaseSendTxs(
//       transaction.instructions,
//       wallet,
//       liquidityBookServices.connection
//     );
//     console.log("🚀 ~ onSwap ~ hash:", hash);
//   };

//   const onAddliquidity = async () => {
//     const tokenX = C98_TOKEN;
//     const tokenY = USDC_TOKEN;

//     const payer = new PublicKey(YOUR_WALLET);
//     const pair = new PublicKey(POOL_PARAMS.address);
//     const shape = LiquidityShape.Spot;
//     const binRange = [-4, 4] as [number, number]; // Example bin range
//     const positions = await liquidityBookServices.getUserPositions({
//       payer,
//       pair,
//     });
//     console.log("🚀 ~ onAddliquidity ~ positions:", positions);
//     const pairInfo = await liquidityBookServices.getPairAccount(pair);
//     const activeBin = pairInfo.activeId;

//     const connection = liquidityBookServices.connection;

//     const { blockhash, lastValidBlockHeight } =
//       await connection.getLatestBlockhash();

//     let currentBlockhash = blockhash;
//     let currentLastValidBlockHeight = lastValidBlockHeight;

//     const maxPositionList = getMaxPosition(
//       [binRange[0], binRange[1]],
//       activeBin
//     );

//     const maxLiqDistribution = createUniformDistribution({
//       shape,
//       binRange,
//     });
//     console.log(
//       "🚀 ~ onAddliquidity ~ maxLiqDistribution:",
//       maxLiqDistribution
//     );

//     const binArrayList = getMaxBinArray(binRange, activeBin);

//     const allTxs: Transaction[] = [];
//     const txsCreatePosition: Transaction[] = [];

//     const initialTransaction = new Transaction();

//     await Promise.all(
//       binArrayList.map(async (item) => {
//         await liquidityBookServices.getBinArray({
//           binArrayIndex: item.binArrayLowerIndex,
//           pair: new PublicKey(pair),
//           payer,
//           transaction: initialTransaction,
//         });

//         await liquidityBookServices.getBinArray({
//           binArrayIndex: item.binArrayUpperIndex,
//           pair: new PublicKey(pair),
//           payer,
//           transaction: initialTransaction,
//         });
//       })
//     );

//     await Promise.all(
//       [tokenX, tokenY].map(async (token) => {
//         await liquidityBookServices.getPairVaultInfo({
//           payer,
//           transaction: initialTransaction,
//           tokenAddress: new PublicKey(token.mintAddress),
//           pair: new PublicKey(pair),
//         });
//         await liquidityBookServices.getUserVaultInfo({
//           payer,
//           tokenAddress: new PublicKey(token.mintAddress),
//           transaction: initialTransaction,
//         });
//       })
//     );

//     if (initialTransaction.instructions.length > 0) {
//       initialTransaction.recentBlockhash = currentBlockhash;
//       initialTransaction.feePayer = payer;
//       allTxs.push(initialTransaction);
//     }

//     const maxLiquidityDistributions = await Promise.all(
//       maxPositionList.map(async (item) => {
//         const {
//           range: relativeBinRange,
//           binLower,
//           binUpper,
//         } = getBinRange(item, activeBin);
//         const currentPosition = positions.find(findPosition(item, activeBin));

//         const findStartIndex = maxLiqDistribution.findIndex(
//           (item) => item.relativeBinId === relativeBinRange[0]
//         );
//         const startIndex = findStartIndex === -1 ? 0 : findStartIndex;

//         const findEndIndex = maxLiqDistribution.findIndex(
//           (item) => item.relativeBinId === relativeBinRange[1]
//         );
//         const endIndex =
//           findEndIndex === -1 ? maxLiqDistribution.length : findEndIndex + 1;

//         const liquidityDistribution = maxLiqDistribution.slice(
//           startIndex,
//           endIndex
//         );

//         const binArray = binArrayList.find(
//           (item) =>
//             item.binArrayLowerIndex * 256 <= binLower &&
//             (item.binArrayUpperIndex + 1) * 256 > binUpper
//         )!;

//         const binArrayLower = await liquidityBookServices.getBinArray({
//           binArrayIndex: binArray.binArrayLowerIndex,
//           pair: new PublicKey(pair),
//           payer,
//         });
//         const binArrayUpper = await liquidityBookServices.getBinArray({
//           binArrayIndex: binArray.binArrayUpperIndex,
//           pair: new PublicKey(pair),
//           payer,
//         });

//         if (!currentPosition) {
//           const transaction = new Transaction();

//           const positionMint = Keypair.generate();

//           const { position } = await liquidityBookServices.createPosition({
//             pair: new PublicKey(pair),
//             payer,
//             relativeBinIdLeft: relativeBinRange[0],
//             relativeBinIdRight: relativeBinRange[1],
//             binArrayIndex: binArray.binArrayLowerIndex,
//             positionMint: positionMint.publicKey,
//             transaction,
//           });
//           transaction.feePayer = payer;
//           transaction.recentBlockhash = currentBlockhash;

//           transaction.sign(positionMint);

//           txsCreatePosition.push(transaction);
//           allTxs.push(transaction);

//           return {
//             positionMint: positionMint.publicKey.toString(),
//             position,
//             liquidityDistribution,
//             binArrayLower: binArrayLower.toString(),
//             binArrayUpper: binArrayUpper.toString(),
//           };
//         }

//         return {
//           positionMint: currentPosition.positionMint,
//           liquidityDistribution,
//           binArrayLower: binArrayLower.toString(),
//           binArrayUpper: binArrayUpper.toString(),
//         };
//       })
//     );

//     const txsAddLiquidity = await Promise.all(
//       maxLiquidityDistributions.map(async (item) => {
//         const {
//           binArrayLower,
//           binArrayUpper,
//           liquidityDistribution,
//           positionMint,
//         } = item;
//         const transaction = new Transaction();
//         await liquidityBookServices.addLiquidityIntoPosition({
//           amountX: Number(convertBalanceToWei(10, tokenX.decimals)),
//           amountY: Number(convertBalanceToWei(0.01, tokenY.decimals)),
//           binArrayLower: new PublicKey(binArrayLower),
//           binArrayUpper: new PublicKey(binArrayUpper),
//           liquidityDistribution,
//           pair: new PublicKey(pair),
//           positionMint: new PublicKey(positionMint),
//           payer,
//           transaction,
//         });

//         transaction.recentBlockhash = currentBlockhash;
//         transaction.feePayer = payer;

//         allTxs.push(transaction);
//         return transaction;
//       })
//     );
//     const response = await window.coin98.sol.signAllTransactions(allTxs);
//     const publicKey = new PublicKey(response.publicKey);
//     const signatures = response.signatures;

//     const signedTxs = allTxs.map((transaction, index) => {
//       const signature = bs58.decode(signatures[index]!);
//       transaction.addSignature(publicKey, signature);
//       return transaction;
//     });

//     const hash: string[] = [];

//     if (initialTransaction.instructions.length) {
//       const tx = signedTxs.shift() || initialTransaction;
//       const txHash = await connection.sendRawTransaction(tx.serialize(), {
//         skipPreflight: false,
//         preflightCommitment: "confirmed",
//       });

//       hash.push(txHash);

//       // await connection.confirmTransaction(
//       //   {
//       //     signature: txHash,
//       //     blockhash: currentBlockhash,
//       //     lastValidBlockHeight: currentLastValidBlockHeight,
//       //   },
//       //   "finalized"
//       // );
//       await checkTransactionFinalized(connection, [txHash]);

//       const { blockhash, lastValidBlockHeight } =
//         await connection.getLatestBlockhash();

//       currentBlockhash = blockhash;
//       currentLastValidBlockHeight = lastValidBlockHeight;
//     }
//     if (txsCreatePosition.length) {
//       await Promise.all(
//         txsCreatePosition.map(async (tx) => {
//           const serializeTx = (signedTxs.shift() || tx).serialize();

//           const txHash = await connection.sendRawTransaction(serializeTx, {
//             skipPreflight: false,
//             preflightCommitment: "confirmed",
//           });

//           hash.push(txHash);
//           await checkTransactionFinalized(connection, [txHash]);

//           // await connection.confirmTransaction(
//           //   {
//           //     signature: txHash,
//           //     blockhash: currentBlockhash,
//           //     lastValidBlockHeight: currentLastValidBlockHeight,
//           //   },
//           //   "finalized"
//           // );
//         })
//       );

//       const { blockhash, lastValidBlockHeight } =
//         await connection!.getLatestBlockhash();

//       currentBlockhash = blockhash;
//       currentLastValidBlockHeight = lastValidBlockHeight;
//     }

//     // Transaction for adding liquidity
//     await Promise.all(
//       txsAddLiquidity.map(async (tx) => {
//         const serializeTx = (signedTxs.shift() || tx).serialize();

//         const txHash = await connection.sendRawTransaction(serializeTx, {
//           skipPreflight: false,
//           preflightCommitment: "confirmed",
//         });
//         if (!txHash) return;

//         hash.push(txHash);
//         await checkTransactionFinalized(connection, [txHash]);

//         // await connection!.confirmTransaction(
//         //   {
//         //     signature: txHash,
//         //     blockhash: currentBlockhash,
//         //     lastValidBlockHeight: currentLastValidBlockHeight,
//         //   },
//         //   "finalized"
//         // );
//       })
//     );

//     console.log("Transaction hashes:", hash);
//   };

//   return (
//     <>
//       <div>TestDLMM</div>
//       <button onClick={onSwap}>Swap C98 to USDC</button>
//       <button onClick={onAddliquidity}>Add Liquidity</button>
//     </>
//   );
// };

// export default TestDLMM;
