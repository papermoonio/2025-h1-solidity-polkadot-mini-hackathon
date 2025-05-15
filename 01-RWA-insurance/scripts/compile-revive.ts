import { task } from "hardhat/config"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

task("compile-revive", "Compiles a contract using Revive")
  .addParam("contract", "The contract file to compile (e.g., Storage.sol)")
  .setAction(async (taskArgs) => {
    const { contract } = taskArgs;
    // Read contract source
    const source = readFileSync(`contracts/${contract}`, "utf8");

    // Correct the input structure for the Revive compiler
    const input = {
      [contract]: {
        content: source,
      },
    };

    console.log(`Compiling contract ${contract} with Revive using solc version 0.8.28...`);

    try {
      const solc = require("solc");
      const solcInput = JSON.stringify({
        language: "Solidity",
        sources: {
          [contract]: { content: source },
        },
        settings: {
          optimizer: {
            enabled: true,
            runs: 400,
          },
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode"],
            },
          },
        },
      });

      const solcOutput = JSON.parse(solc.compile(solcInput));

      if (solcOutput.errors) {
        for (const error of solcOutput.errors) {
          console.error(error.formattedMessage);
        }
        throw new Error("Compilation failed with errors.");
      }

      // Extract compilation artifacts
      for (const [fileName, contracts] of Object.entries(solcOutput.contracts || {})) {
        for (const [name, contract] of Object.entries(contracts as Record<string, any>)) {
          const contractDir = join("artifacts", "contracts", name);
          if (!existsSync(contractDir)) {
            mkdirSync(contractDir, { recursive: true });
          }
          writeFileSync(
            join(contractDir, `${name}.json`),
            JSON.stringify(contract.abi, null, 2)
          );
          writeFileSync(
            join(contractDir, `${name}.polkavm`),
            Buffer.from(contract.evm.bytecode.object, "hex")
          );
          console.log(`Compiled ${name} successfully`);
        }
      }
    } catch (error) {
      console.error("Compilation failed:", error);
      process.exit(1);
    }
  });