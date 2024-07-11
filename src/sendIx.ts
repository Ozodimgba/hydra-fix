import { TransactionResult, Wallet } from "@glasseaters/hydra-sdk";
import { Connection, PublicKey, Signer, Transaction, TransactionInstruction, ComputeBudgetProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { ProgramError } from "@strata-foundation/spl-utils";

export async function sendInstructions(
    instructions: TransactionInstruction[],
    signers: Signer[],
    connection: Connection,
    wallet: Wallet,
    payer?: PublicKey
): Promise<TransactionResult> {
    let tx = new Transaction();
    tx.feePayer = payer || wallet.publicKey;

    // Add compute budget instructions
    const computeBudgetInstructions = [
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 10000
        })
    ];
    tx.add(...computeBudgetInstructions);
    tx.add(...instructions);

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    if (signers?.length > 0) {
        tx.sign(...signers);
    } else {
        tx = await wallet.signTransaction(tx);
    }

    try {
        const sig = await sendAndConfirmTransaction(
            connection,
            tx,
            [],
            {
                commitment: 'confirmed', // Using 'confirmed' to ensure the transaction is confirmed
                preflightCommitment: 'confirmed',
                skipPreflight: true,
            }
        );

        console.log(sig)

        return {
            RpcResponseAndContext: await connection.confirmTransaction(
                sig,
                'confirmed'
            ),
            TransactionSignature: sig,
        };
    } catch (e) {
        const idlErrors = new Map<number, string>([
            // temporary error code to satisfy typing
            [300, "Custom error message 1"],
            [301, "Custom error message 2"],
        ]);
        const wrappedE = ProgramError.parse(e, idlErrors);
        throw wrappedE == null ? e : wrappedE;
    }
}
