import {
  mplHydra,
  Fanout,
  fetchFanout,
  findFanoutNativeAccountPda,
  findFanoutPda,
  init,
  MembershipModel,
} from "@metaplex-foundation/mpl-hydra";
import {
  generateRandomString,
  publicKey,
  generateSigner,
  none,
  keypairIdentity,
  Context,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  setComputeUnitPrice,
  setComputeUnitLimit,
} from "@metaplex-foundation/mpl-toolbox";
import base58 from "bs58";

// secret key base_58
const SK_B58 = "";

(async () => {
  const umi = createUmi("<endpoint>").use(mplHydra());

  const name = generateRandomString();

  const secretKey = base58.decode(SK_B58);

  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);

  umi.use(keypairIdentity(signer));

  let tx = await init(umi, {
    name,
    model: MembershipModel.Wallet,
    totalShares: 100,
  })
    .prepend(setComputeUnitPrice(umi, { microLamports: 50000 }))
    .prepend(setComputeUnitLimit(umi, { units: 50_000 }))
    .sendAndConfirm(umi);

  console.log(base58.encode(tx.signature));

  // const [fanout, fanoutBump] = findFanoutPda(umi, { name });
  // console.log(fanout, fanoutBump);

  // console.log(umi);

  // const k = generateSigner(umi).publicKey;
  // const k = umi.eddsa.generateKeypair()

  // console.log(k)
})();
