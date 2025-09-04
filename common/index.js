const {
  Connection,
  clusterApiUrl,
  PublicKey,
  TransactionMessage,
} = require("@solana/web3.js");
const LiquidityBookIDL = require("./liquidity_book.json");
const { u16, u64, struct, vec, i32 } = require("@project-serum/borsh");
const { Telegraf, session } = require("telegraf");

const connection = new Connection(
  "https://alien-alpha-surf.solana-mainnet.quiknode.pro/15400540d02950f29103418925d8e481684ed69d/",
  {
    commitment: "finalized",
    wsEndpoint:
      "wss://alien-alpha-surf.solana-mainnet.quiknode.pro/15400540d02950f29103418925d8e481684ed69d/",
  }
);
const LB_PROGRAM = "1qbkdrr3z4ryLA7pZykqxvxWPoeifcVKo6ZG9CfkvVE";
const BOT_TOKEN = "7785917326:AAFVtKdra4QzQjtS-ucuEUUevH7t-WlzttU";

const bot = new Telegraf(BOT_TOKEN);

bot.use(session());
bot.start((ctx) => {
  ctx.reply("Cái bô DLMM");
});

bot.launch(() => {
  console.log("start");
});

const sendMessage = ({
  tokenIn,
  tokenOut,
  poolAddress,
  addressX,
  addressY,
}) => {
  bot.telegram.sendMessage(
    -1002662451552,
    `New position added to pool: ${poolAddress}\n\n` +
      `Token In: ${tokenIn}\n` +
      `Token Out: ${tokenOut}\n` +
      `Pool Address: ${poolAddress}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Go to swap`,
              url: `https://dlmm.saros.xyz/swap?tokenIn=${addressX}&tokenOut=${addressY}`,
            },
            {
              text: `Go to scan`,
              url: `https://solscan.io/account/${poolAddress}`,
            },
          ],
        ],
      },
    }
  );
};

const INCREASE_POSITION_STRUCT = LiquidityBookIDL.instructions.find(
  (item) => item.name === "increase_position"
);

const trackingAddLiquidityInstruction = async (instruction) => {
  const discimatorInstruction = instruction.data.subarray(0, 8);
  const discriminator = Buffer.from(INCREASE_POSITION_STRUCT.discriminator);
  if (!discimatorInstruction.equals(discriminator)) return;

  const binLiquidityDistributionLayout = struct([
    i32("relative_bin_id"),
    u16("distribution_x"),
    u16("distribution_y"),
  ]);

  const borshLayout = struct([
    u64("amount_x"),
    u64("amount_y"),
    vec(binLiquidityDistributionLayout, "liquidity_distribution"),
  ]);
  const dataWithoutDiscriminator = instruction.data.slice(8);
  const decodedData = borshLayout.decode(dataWithoutDiscriminator);

  const accounts = INCREASE_POSITION_STRUCT.accounts.map((item, index) => {
    return {
      name: item.name,
      address: instruction.keys[index].pubkey.toString(),
    };
  });
  const pairAddress = accounts.find((item) => item.name === "pair")?.address;
  const tokenMintX = accounts.find(
    (item) => item.name === "token_mint_x"
  )?.address;
  const tokenMintY = accounts.find(
    (item) => item.name === "token_mint_y"
  )?.address;
  const tokenX = TOKENS[tokenMintX];
  const tokenY = TOKENS[tokenMintY];
  const poolSymbol = `${tokenX?.symbol || "UNKNOWN"}-${
    tokenY?.symbol || "UNKNOWN"
  }`;

  console.log("🩲 🩲 => trackingAddLiquidityInstruction => decodedData:", {
    amount_x: decodedData.amount_x.toString(),
    amount_y: decodedData.amount_y.toString(),
    liquidity_distribution: decodedData.liquidity_distribution.map((item) => ({
      relative_bin_id: item.relative_bin_id.toString(),
      amount_x: item.distribution_x.toString(),
      amount_y: item.distribution_y.toString(),
    })),
    info: {
      pairAddress,
      tokenMintX: tokenX?.symbol || tokenMintX,
      tokenMintY: tokenY?.symbol || tokenMintY,
      poolSymbol,
    },
  });

  sendMessage({
    tokenIn: tokenX?.symbol || tokenMintX,
    tokenOut: tokenY?.symbol || tokenMintY,
    poolAddress: pairAddress,
    addressX: tokenMintX,
    addressY: tokenMintY,
  });
};

const INITIALIZE_PAIR_STRUCT = LiquidityBookIDL.instructions.find(
  (item) => item.name === "initialize_pair"
);

const trackingPairAddress = (instruction) => {
  const discimatorInstruction = instruction.data.subarray(0, 8);
  const discriminator = Buffer.from(INITIALIZE_PAIR_STRUCT.discriminator);
  if (!discimatorInstruction.equals(discriminator)) return;

  const accounts = INITIALIZE_PAIR_STRUCT.accounts.map((item, index) => {
    return {
      name: item.name,
      address: instruction.keys[index].pubkey.toString(),
    };
  });
  const pairAddress = accounts.find((item) => item.name === "pair")?.address;
  return pairAddress;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

connection.onLogs(
  new PublicKey(LB_PROGRAM),
  async (logInfo) => {
    // Example usage of sleep function
    await sleep(2000); // Sleep for 1 second

    const parsedTransaction = await connection.getTransaction(
      logInfo.signature,
      {
        maxSupportedTransactionVersion: 0,
        commitment: "finalized",
      }
    );
    if (!parsedTransaction) return;

    const compiledMessage = parsedTransaction.transaction.message;
    const message = TransactionMessage.decompile(compiledMessage);
    const instructions = message.instructions;

    for (const instruction of instructions) {
      trackingPairAddress(instruction);
      trackingAddLiquidityInstruction(instruction);
    }
  },
  "finalized"
);

const TOKENS = {
  SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL: {
    symbol: "SAROS",
    decimal: 6,
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    symbol: "USDC",
    decimal: 6,
  },
  So11111111111111111111111111111111111111112: {
    symbol: "SOL",
    decimal: 9,
  },
};
