// "use server"

// // import { LiquidityBookServices, MODE } from "@saros-finance/dlmm-sdk";
// import { PublicKey } from "@solana/web3.js";
// import BN from 'bn.js';

// // Pool example on saros C98 to USDC
// const SOL_TOKEN = {
//     mintAddress: "So11111111111111111111111111111111111111112",
//     symbol: "SOL",
//     decimals: 6,
//   };
  
//   const SAROS_TOKEN = {
//     mintAddress: "SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL",
//     symbol: "SAROS",
//     decimals: 6,
//   };
  
//   const POOL_PARAMS = {
//     address: "AkThzPQbBsyLCAJYFsEDtzC3souRSfuW2uQnLcr6MxLg",
//     baseToken: SOL_TOKEN,
//     quoteToken: SAROS_TOKEN,
//     slippage: 0.5,
//     hook: "", // config for reward, adding later
//   };

// const liquidityBookServices = new LiquidityBookServices({
//     mode: MODE.MAINNET,
//     options: {
//       rpcUrl: "https://superwallet-information-api.coin98.tech/api/solanaV4",
//     },
//   });
  

// export const getQuote = async () => {
//   // console.log(liquidityBookServices)
//     const swapForY = true;
//     const amountFrom = 1e6; // Token C98
//     const quoteData = await liquidityBookServices.getQuote({
//       amount: BigInt(amountFrom),
//       isExactInput: true, // input amount in
//       swapForY, // swap from C98 to USDC
//       pair: new PublicKey(POOL_PARAMS.address),
//       tokenBase: new PublicKey(POOL_PARAMS.baseToken.mintAddress),
//       tokenQuote: new PublicKey(POOL_PARAMS.quoteToken.mintAddress),
//       tokenBaseDecimal: POOL_PARAMS.baseToken.decimals,
//       tokenQuoteDecimal: POOL_PARAMS.quoteToken.decimals,
//       slippage: POOL_PARAMS.slippage,
//     });

//     if (!quoteData) {
//         throw new Error("Failed to generate quote data");
//       }

//     console.log("🚀 ~ getQuote ~ quoteData:", quoteData)
//     return quoteData;
// }

// export const swapSaros = async (
//   connection,
//   userTokenSourceAddress,
//   userTokenDestinationAddress,
//   amountFrom,
//   minimumAmountTo,
//   hostFeeOwnerAddress,
//   poolAddress,
//   walletAddress,
//   fromCoinMint,
//   toCoinMint
// ) => {
//   const amountIn = convertBalanceToWei(amountFrom);
//   const minimumAmountOut = convertBalanceToWei(minimumAmountTo);
//   const transaction = await createTransactions(connection, walletAddress);
//   const tokenSwapProgramId = SAROS_SWAP_PROGRAM_ADDRESS_V1;
//   const [poolAuthorityAddress] = await findPoolAuthorityAddress(
//     poolAddress,
//     tokenSwapProgramId
//   );
//   const poolAccountInfo = await getPoolInfo(connection, poolAddress);
//   const fromMint = fromCoinMint;
//   const toMint = toCoinMint;

//   const newFromAccount = await createAssociatedTokenAccountIfNotExist(
//     userTokenSourceAddress.toString(),
//     new PublicKey(walletAddress),
//     fromMint,
//     transaction
//   );
//   const newToAccount = await createAssociatedTokenAccountIfNotExist(
//     userTokenDestinationAddress.toString(),
//     new PublicKey(walletAddress),
//     toMint,
//     transaction
//   );

//   let poolTokenSourceAddress = null;
//   let poolTokenDestinationAddress = null;
//   if (fromMint === poolAccountInfo.token0Mint.toBase58()) {
//     poolTokenSourceAddress = poolAccountInfo.token0Account;
//   }
//   if (fromMint === poolAccountInfo.token1Mint.toBase58()) {
//     poolTokenSourceAddress = poolAccountInfo.token1Account;
//   }
//   if (toMint === poolAccountInfo.token0Mint.toBase58()) {
//     poolTokenDestinationAddress = poolAccountInfo.token0Account;
//   }
//   if (toMint === poolAccountInfo.token1Mint.toBase58()) {
//     poolTokenDestinationAddress = poolAccountInfo.token1Account;
//   }

//   let hostFeeTokenAddress = null;
//   if (hostFeeOwnerAddress) {
//     hostFeeTokenAddress = await findAssociatedTokenAddress(
//       hostFeeOwnerAddress,
//       poolAccountInfo.lpTokenMint
//     );
//     if (!(await isAddressInUse(connection, hostFeeTokenAddress))) {
//       const createATPATransaction =
//         await TokenProgramInstructionService.createAssociatedTokenAccountTransaction(
//           owner.publicKey,
//           hostFeeOwnerAddress,
//           poolAccountInfo.lpTokenMint
//         );
//       transaction.add(createATPATransaction.instructions[0]);
//     }
//   }

//   const swapInstruction =
//     await SarosSwapInstructionService.createSwapInstruction(
//       poolAddress,
//       poolAuthorityAddress,
//       new PublicKey(walletAddress),
//       newFromAccount,
//       poolTokenSourceAddress,
//       poolTokenDestinationAddress,
//       newToAccount,
//       poolAccountInfo.lpTokenMint,
//       poolAccountInfo.feeAccount,
//       hostFeeTokenAddress,
//       tokenSwapProgramId,
//       TOKEN_PROGRAM_ID,
//       new BN(amountIn),
//       new BN(minimumAmountOut)
//     );
//   transaction.add(swapInstruction);

//   return transaction;
// };