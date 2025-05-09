import { task } from "hardhat/config"
import { compile } from "@parity/revive"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

task("compile-revive", "Compiles a contract using Revive")
  .addParam("contract", "The contract file to compile (e.g., Storage.sol)")
  .setAction(async (taskArgs) => {
    const { contract } = taskArgs;
    // Read contract source
    const source = readFileSync(`contracts/${contract}`, "utf8");

    // Prepare input for revive compiler
    const input = {
      [contract]: {
        content: source,
      },
    };

    console.log(`Compiling contract ${contract} with Revive...`);

    try {
      // Compile the contract
      const output = await compile(input);

      // Extract compilation artifacts
      for (const contracts of Object.values(output.contracts)) {
        for (const [name, contract] of Object.entries(contracts)) {
          // Ensure the directory exists before saving the files
          const contractDir = join("artifacts", "contracts", name);
          if (!existsSync(contractDir)) {
            mkdirSync(contractDir, { recursive: true });
          }
          // Save ABI
          writeFileSync(
            join(contractDir, `${name}.json`),
            JSON.stringify(contract.abi, null, 2)
          );

          // Save bytecode
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