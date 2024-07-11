import { 
    mplHydra, 
    Fanout, 
    fetchFanout, 
    findFanoutNativeAccountPda, 
    findFanoutPda, 
    init, 
    MembershipModel
 } from "@metaplex-foundation/mpl-hydra";
import { generateRandomString, publicKey, generateSigner, none, keypairIdentity, Context, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { clusterApiUrl } from "@solana/web3.js";
import base58 from "bs58";


// secret key base_58 
const SK_B58 = "";

(async () => {
  
    // const createUmi = async () => (await baseCreateUmi(`https://mainnet.helius-rpc.com/?api-key=${API_KEY}`)).use(mplHydra());

    const createUmi = async () => (await baseCreateUmi(clusterApiUrl("devnet"))).use(mplHydra());

    const umi = await createUmi();
    const name = generateRandomString();
  
    const secretKey = base58.decode(SK_B58)


    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const signer = createSignerFromKeypair(umi, keypair);
    umi.identity = signer;
    umi.payer = signer;
    
    umi.use(keypairIdentity(signer, true))

    const wallet = await init(umi, {
        name,
        model: MembershipModel.Wallet,
        totalShares: 100,
      }).sendAndConfirm(umi);
    
    
    console.log(base58.encode(wallet.signature));


    // const [fanout, fanoutBump] = findFanoutPda(umi, { name });
    // console.log(fanout, fanoutBump);

    // console.log(umi);

    // const k = generateSigner(umi).publicKey;
    // const k = umi.eddsa.generateKeypair()

    // console.log(k)
})();
