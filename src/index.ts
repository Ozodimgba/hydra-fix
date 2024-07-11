import { Fanout, FanoutClient, MembershipModel } from "@glasseaters/hydra-sdk";
import { NodeWallet } from "@project-serum/common";
import {
    Account,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";
import base58 from "bs58";
import { sendInstructions } from "./sendIx";


type BuiltWalletFanout = {
    fanout: PublicKey;
    payingAccount: PublicKey;
    fanoutAccountData: Fanout;
    members: WalletFanoutMember[];
    tx: string;
  };

  type WalletFanoutMember = {
    voucher: PublicKey;
    wallet: Keypair | PublicKey;
  };

  type User = {
    publicKey: string;
  }

  enum RPCcluster {
    devnet = 'devnet',
    mainnet = 'mainnet-beta'
  }

  interface SplitParam {
    recipient: User;
    protocol: User[];
    authority: string;
    cluster: 'devnet' | 'mainnet-beta';
  }


  /**
   * @description This function creates a split wallet that shares SPL Tokens amongst it member based on a preset percentage.
   * @param users This is an array of type e.g [{ user: publicKey }, { user: publicKey }] 
   * @throws error users share percentage must add up to 100
   * @param authority this is the walllet that pays for the creation of the wallet
   * @param name this is the name or walletID of the wallet
   * @param cluster This is whether the wallet is created on mainet and devnet
   */

  export async function createSplitWallet({ recipient, protocol, authority, cluster }: SplitParam): Promise<BuiltWalletFanout> {

    const connection = new Connection(clusterApiUrl(cluster), "confirmed");
    let authorityWallet: Keypair;
    let fanoutSdk: FanoutClient;

    const walletBytes = base58.decode(authority)
    authorityWallet = Keypair.fromSecretKey(walletBytes)

    fanoutSdk = new FanoutClient(
      connection,
      new NodeWallet(new Account(authorityWallet.secretKey))
    );

    const name = `Stable-pay-${Date.now()}`; 
    const init = await fanoutSdk.initializeFanout({
      totalShares: 200,
      name,
      membershipModel: MembershipModel.Wallet,
    });

    //Protocol wallets
    let protocolOne = new PublicKey(protocol[0].publicKey);
    let protocolTwo = new PublicKey(protocol[1].publicKey)

    //merchant
    let merchant = new PublicKey(recipient.publicKey)

    let members: WalletFanoutMember[] = [];
    let ixs: TransactionInstruction[] = [];

    let ix = await fanoutSdk.addMemberWalletInstructions({
      fanout: init.fanout,
      fanoutNativeAccount: init.nativeAccount,
      membershipKey: merchant,
      shares: 198,
    });


    members.push({
      voucher: ix.output.membershipAccount,
      wallet: merchant,
    });
    ixs.push(...ix.instructions);

    ix = await fanoutSdk.addMemberWalletInstructions({
      fanout: init.fanout,
      fanoutNativeAccount: init.nativeAccount,
      membershipKey: protocolOne,
      shares: 1,
    });

    members.push({
      voucher: ix.output.membershipAccount,
      wallet: protocolOne,
    });
    ixs.push(...ix.instructions);

    ix = await fanoutSdk.addMemberWalletInstructions({
      fanout: init.fanout,
      fanoutNativeAccount: init.nativeAccount,
      membershipKey: protocolTwo,
      shares: 1,
    });

    members.push({
      voucher: ix.output.membershipAccount,
      wallet: protocolTwo,
    });
    ixs.push(...ix.instructions);

     /**
     * send instruction here is a local adaptation of:
     * const tx = await fanoutSdk.sendInstructions(
        ixs,
        [],
        fanoutSdk.wallet.publicKey
       );

     #[reference]: https://github.com/GlassEaters/hydra/blob/7fc0fa992ed970791072639bf0be079a1eadd68c/packages/sdk/src/index.ts#L234

     sendInstructions is adapted so I can add prioty fees and focus on how I send the tx on mainnet
  
     */

     const tx = await sendInstructions(
      ixs,
      [],
      connection,
      new NodeWallet(new Account(authorityWallet.secretKey)),
      fanoutSdk.wallet.publicKey
    );

    if (tx.RpcResponseAndContext.value.err === null) {
      const txdetails = await fanoutSdk.connection.getConfirmedTransaction(
        tx.TransactionSignature
      );
      // console.log(tx.TransactionSignature);
    }

    const fanoutAccount = await fanoutSdk.fetch<Fanout>(init.fanout, Fanout);

    return {
      fanout: init.fanout,
      payingAccount: fanoutAccount.accountKey,
      fanoutAccountData: fanoutAccount,
      members: members,
      tx: tx.TransactionSignature
    };
  }

  let recipient = { publicKey: 'D81KGGEMs5Sh6qcrn1fZvGPy5LRA5cVf69ffEHTRvVhQ'}
  let protocol = [{ publicKey: 'HzGDWs1S7kx46TJPNbWp5pnUewPoCUybs15xPvYEXSQW' }, { publicKey: 'LvoDKfhTKDaohegBVc1vuJPJkFkx7aETVcbbTKmUS6b' }];
  //authority is a base58 private key
  let authority = '';
  let cluster = RPCcluster.devnet;


  createSplitWallet({recipient, protocol, authority, cluster})
  .then((results) => console.log(results))
