"use client";
import {
  getSwapExactOutSaros,
  swapSaros,
} from "@saros-finance/sdk/src/swap";
import React, { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

// const liquidityBookServices = new LiquidityBookServices({
//   mode: MODE.MAINNET,
//   options: {
//     rpcUrl: "https://superwallet-information-api.coin98.tech/api/solanaV4",
//     commitmentOrConfig: {
//       commitment: "confirmed",
//       httpHeaders: {
//         development: "coin98",
//       },
//     },
//   },
// });

const USDC_TOKEN = {
  id: "usd-coin",
  mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  symbol: "usdc",
  name: "USD Coin",
  icon: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  decimals: "6",
  addressSPL: "HgMPoXcb4JftmTY1cxY63pZYtd17U2Hjz9YXFwc7g1rw",
};

const SAROS_TOKEN = {
  id: "saros",
  mintAddress: "SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL",
  symbol: "SAROS",
  name: "SAROS",
  icon: "https://assets.coingecko.com/markets/images/861/large/saros.png?1754059184",
  decimals: "6",
  addressSPL: "AwN2hehmH2qMqtzg3c5QzLX4cPG5iQzrB671EdeWo7uG",
};

const SLIPPAGE = 1;

const poolParams = {
  address: "7EFmig3Jb9j1kJ7ppaUs5iY8P5pBnRdQXUR4q9vSCY37",
  tokens: {
    SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL: {
      ...SAROS_TOKEN,
    },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
      ...USDC_TOKEN,
    },
  },
  tokenIds: [
    "SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ],
};

const SAROS_SWAP_PROGRAM_ADDRESS_V1 = new PublicKey(
  "SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr"
);

const accountSol = "RFdow49qKnuRLKu24XjJFiyhsXjaUWtzNxeA38t58At"; // owner address

const payerAccount = { publicKey: new PublicKey(accountSol) };

const TestAMM = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setOutput(value);
  };
  const getSwapExactOut = async () => {
    const connection = new Connection(
      "https://superwallet-information-api.coin98.tech/api/solanaV4",
      {
        commitment: "confirmed",
        httpHeaders: {
          development: "coin98",
        },
      }
    );
    // const fromMint = SAROS_TOKEN.mintAddress;
    // const toMint = USDC_TOKEN.mintAddress;
    const toMint = SAROS_TOKEN.mintAddress;
    const fromMint = USDC_TOKEN.mintAddress;
    const toAmount = Number(output);
    // const estSwap = await getSwapAmountSaros(
    //   connection,
    //   fromMint,
    //   toMint,
    //   toAmount,
    //   SLIPPAGE,
    //   poolParams
    // );
    // console.log("🚀 ~ getSwapExactOutSaros ~ estSwap:", estSwap);
    // if (estSwap === 0 || !estSwap.amountOutWithSlippage) return;

    const estSwapExactOut = await getSwapExactOutSaros(
      connection,
      fromMint,
      toMint,
      toAmount,
      SLIPPAGE,
      poolParams
    );
    console.log(
      "🚀 ~ getSwapExactOutSaros ~ estSwapExactOut:",
      estSwapExactOut
    );
    if (estSwapExactOut === 0 || !estSwapExactOut.amountInWithSlippage) {
      return;
    }
    setInput(estSwapExactOut?.amountInWithSlippage?.toString());
  };

  const onSwap = async () => {
    const fromAmount = output;
    const connection = new Connection(
      "https://superwallet-information-api.coin98.tech/api/solanaV4",
      {
        commitment: "confirmed",
        httpHeaders: {
          development: "coin98",
        },
      }
    );
    // const connection = liquidityBookServices.connection;
    const fromTokenAccount = SAROS_TOKEN.addressSPL;
    const toTokenAccount = USDC_TOKEN.addressSPL;
    const toMint = SAROS_TOKEN.mintAddress;
    const fromMint = USDC_TOKEN.mintAddress;
    const { amountInWithSlippage } = await getSwapExactOutSaros(
      connection,
      fromMint,
      toMint,
      Number(fromAmount),
      SLIPPAGE,
      poolParams
    );
    console.log("🚀 ~ onSwap ~ amountInWithSlippage:", amountInWithSlippage);
    const result = await swapSaros(
      connection,
      fromTokenAccount.toString(),
      toTokenAccount.toString(),
      parseFloat(amountInWithSlippage),
      parseFloat(fromAmount),
      null,
      new PublicKey(poolParams.address),
      accountSol,
      fromMint,
      toMint
    );
    console.log("🚀 ~ onSwap ~ result:", result);
  };

  const onClear = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div>
      TestAMM
      <div style={{ display: "flex" }}>
        <div>
          <div>{USDC_TOKEN.name}</div>
          <input
            style={{ border: "1px solid black" }}
            placeholder="Input"
            // onChange={onChange}
            value={input}
            name="input"
          />
        </div>
        <div>
          <div>{SAROS_TOKEN.name}</div>
          <input
            style={{ border: "1px solid black" }}
            placeholder="Output"
            value={output}
            name="output"
            onChange={onChange}
          />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={getSwapExactOut}>Est Output</button>
        <button onClick={onSwap}>Swap</button>
        <button onClick={onClear}>Clear</button>
      </div>
    </div>
  );
};

export default TestAMM;
