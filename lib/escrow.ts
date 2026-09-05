import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  formatEther,
  formatUnits,
  isAddress,
  type Eip1193Provider,
  type Signer,
} from "ethers";
import abi from "./abi.json";

export const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");
export const isLocalChain = chainId === 31337;
export const networkName = isLocalChain ? "Local testnet" : "Sepolia";
export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const mockTokenAddress = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || "";
export const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";
const deployBlock = Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0");
export const configured =
  isAddress(contractAddress) && [31337, 11155111].includes(chainId);
export const statusNames = [
  "Funded",
  "Delivered",
  "Disputed",
  "Released",
  "Refunded",
] as const;
export type Status = (typeof statusNames)[number];
export type Role = "Client" | "Contributor" | "Arbitrator" | "Observer";
export type Job = {
  id: number;
  client: string;
  freelancer: string;
  arbitrator: string;
  token: string;
  asset: Asset;
  title: string;
  agreementRef: string;
  total: bigint;
  released: bigint;
  refunded: bigint;
  createdAt: number;
};
export type Asset = { symbol: string; decimals: number; token: string };
export type Reputation = {
  releasedMilestones: number;
  completedJobs: number;
  score: number;
  supported: boolean;
};
export type Milestone = {
  title: string;
  amount: bigint;
  status: number;
  evidenceRef: string;
  disputeReason: string;
};
export type Activity = {
  key: string;
  name: string;
  milestoneId?: number;
  detail: string;
  hash: string;
  block: number;
  index: number;
  timestamp: number;
};
export type EthereumProvider = Eip1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
let provider: JsonRpcProvider | undefined;
let bonusSupport: Promise<boolean> | undefined;
export function readProvider() {
  provider ??= new JsonRpcProvider(rpcUrl, undefined, {
    cacheTimeout: -1,
    pollingInterval: 1200,
  });
  return provider;
}
export function escrow(signer?: Signer) {
  return new Contract(contractAddress, abi, signer ?? readProvider());
}
function supportsBonuses() {
  bonusSupport ??= escrow()
    .JOB_COMPLETION_BONUS()
    .then((value: bigint) => value === 5n)
    .catch(() => false);
  return bonusSupport;
}
export function erc20(address: string, signer?: Signer) {
  return new Contract(
    address,
    [
      "function approve(address spender,uint256 amount) returns (bool)",
      "function allowance(address owner,address spender) view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ],
    signer ?? readProvider(),
  );
}
export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
export function eth(amount: bigint) {
  return formatEther(amount);
}
export function formatAmount(amount: bigint, asset: Asset) {
  return formatUnits(amount, asset.decimals);
}
export function roleFor(job: Job, address: string): Role {
  const same = (other: string) => address.toLowerCase() === other.toLowerCase();
  return same(job.client)
    ? "Client"
    : same(job.freelancer)
      ? "Contributor"
      : same(job.arbitrator)
        ? "Arbitrator"
        : "Observer";
}
export function explorer(hash: string, type: "tx" | "address" = "tx") {
  return isLocalChain ? null : `https://sepolia.etherscan.io/${type}/${hash}`;
}
export function evidenceUrl(value: string) {
  if (value.startsWith("ipfs://")) {
    const path = value.slice(7);
    if (/^[a-zA-Z0-9]+(?:\/[a-zA-Z0-9._~!$&'()*+,;=:@%/-]*)?$/.test(path))
      return `https://ipfs.io/ipfs/${path}`;
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
export function localDemoAllowed() {
  return (
    isLocalChain &&
    typeof window !== "undefined" &&
    ["127.0.0.1", "localhost"].includes(window.location.hostname) &&
    /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(rpcUrl)
  );
}
export async function demoSigner(index: number) {
  if (!localDemoAllowed() || ![0, 1, 2].includes(index))
    throw new Error(
      "Demo accounts are available only on the local development chain.",
    );
  return readProvider().getSigner(index);
}
export async function walletSigner() {
  if (!window.ethereum)
    throw new Error("Install MetaMask to connect a wallet, then reload Pact.");
  const wallet = window.ethereum;
  const actual = Number(await wallet.request({ method: "eth_chainId" }));
  if (actual !== chainId) {
    try {
      await wallet.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch {
      throw new Error(`Switch MetaMask to ${networkName}, then connect again.`);
    }
  }
  await wallet.request({ method: "eth_requestAccounts" });
  const browser = new BrowserProvider(wallet);
  return browser.getSigner();
}
export async function assertWalletNetwork() {
  if (
    !window.ethereum ||
    Number(await window.ethereum.request({ method: "eth_chainId" })) !== chainId
  )
    throw new Error(`Wallet network changed. Reconnect on ${networkName}.`);
}
export async function fetchJobs(): Promise<Job[]> {
  if (!configured) return [];
  const rpc = readProvider();
  if ((await rpc.getNetwork()).chainId !== BigInt(chainId))
    throw new Error(
      "The read connection is on the wrong network. Check the app configuration.",
    );
  if ((await rpc.getCode(contractAddress)) === "0x")
    throw new Error(
      "No escrow contract exists at this address. The local chain may have restarted; redeploy and restart the app.",
    );
  const bonuses = await supportsBonuses();
  const c = bonuses
    ? escrow()
    : new Contract(
        contractAddress,
        [
          "function jobCount() view returns (uint256)",
          "function getJob(uint256) view returns ((address client,address freelancer,address arbitrator,string title,string agreementRef,uint256 total,uint256 released,uint256 refunded,uint256 createdAt))",
        ],
        rpc,
      );
  const count = Number(await c.jobCount());
  const assets = new Map<string, Promise<Asset>>();
  const getAsset = (token: string) => {
    const key = token.toLowerCase();
    if (token === "0x0000000000000000000000000000000000000000")
      return Promise.resolve({ symbol: "ETH", decimals: 18, token });
    if (!assets.has(key))
      assets.set(
        key,
        Promise.all([erc20(token).symbol(), erc20(token).decimals()])
          .then(([symbol, decimals]) => ({
            symbol: String(symbol).slice(0, 12),
            decimals: Number(decimals),
            token,
          }))
          .catch(() => ({ symbol: "ERC-20", decimals: 18, token })),
      );
    return assets.get(key)!;
  };
  return Promise.all(
    Array.from({ length: Math.min(count, 50) }, (_, i) => count - i - 1).map(
      async (id) => {
        const j = await c.getJob(id);
        const token = bonuses
          ? j.token
          : "0x0000000000000000000000000000000000000000";
        const asset = await getAsset(token);
        return {
          id,
          client: j.client,
          freelancer: j.freelancer,
          arbitrator: j.arbitrator,
          token,
          asset,
          title: j.title,
          agreementRef: j.agreementRef,
          total: j.total,
          released: j.released,
          refunded: j.refunded,
          createdAt: Number(j.createdAt),
        };
      },
    ),
  );
}
export async function fetchReputation(address: string): Promise<Reputation> {
  if (!(await supportsBonuses()))
    return {
      releasedMilestones: 0,
      completedJobs: 0,
      score: 0,
      supported: false,
    };
  const value = await escrow().getReputation(address);
  return {
    releasedMilestones: Number(value.releasedMilestones),
    completedJobs: Number(value.completedJobs),
    score: Number(value.score),
    supported: true,
  };
}
export async function fetchMilestones(id: number): Promise<Milestone[]> {
  const items = await escrow().getMilestones(id);
  return items.map((m: Milestone) => ({
    title: m.title,
    amount: m.amount,
    status: Number(m.status),
    evidenceRef: m.evidenceRef,
    disputeReason: m.disputeReason,
  }));
}
export async function fetchActivity(id: number): Promise<Activity[]> {
  const rpc = readProvider();
  const c = escrow();
  const latest = await rpc.getBlockNumber();
  const topic = `0x${BigInt(id).toString(16).padStart(64, "0")}`;
  const logs = [];
  // Bounded block ranges work with ordinary RPC providers. Deployment block is
  // recorded during deployment; it avoids scanning Sepolia from genesis.
  if (!isLocalChain && deployBlock === 0)
    throw new Error("Set the deployment block to load the activity trail.");
  for (let from = deployBlock; from <= latest; from += 5000) {
    logs.push(
      ...(await rpc.getLogs({
        address: contractAddress,
        topics: [null, topic],
        fromBlock: from,
        toBlock: Math.min(from + 4999, latest),
      })),
    );
  }
  const recent = logs.slice(-60).reverse();
  const blocks = new Map<number, number>();
  await Promise.all(
    [...new Set(recent.map((log) => log.blockNumber))].map(async (number) => {
      const block = await rpc.getBlock(number);
      blocks.set(number, block?.timestamp ?? 0);
    }),
  );
  return recent.flatMap((log) => {
    const event = c.interface.parseLog(log);
    if (!event) return [];
    const detail =
      event.name === "JobCreated"
        ? "Client funded the complete agreement."
        : event.name === "MilestoneDelivered"
          ? event.args.evidenceRef
          : event.name === "MilestoneDisputed"
            ? event.args.reason
            : event.args.decision;
    return [
      {
        key: `${log.transactionHash}-${log.index}`,
        name:
          event.name === "MilestoneSettled"
            ? Number(event.args.status) === 3
              ? "Payment released"
              : "Payment refunded"
            : event.name === "JobCreated"
              ? "Agreement funded"
              : event.name === "MilestoneDelivered"
                ? "Work submitted"
                : "Dispute opened",
        milestoneId:
          event.name === "JobCreated"
            ? undefined
            : Number(event.args.milestoneId),
        detail,
        hash: log.transactionHash,
        block: log.blockNumber,
        index: log.index,
        timestamp: blocks.get(log.blockNumber) ?? 0,
      },
    ];
  });
}
export function friendlyError(error: unknown): string {
  const e = error as {
    code?: string | number;
    shortMessage?: string;
    message?: string;
    revert?: { name?: string };
    info?: { error?: { code?: number } };
  };
  if (
    e.code === "ACTION_REJECTED" ||
    e.code === 4001 ||
    e.info?.error?.code === 4001
  )
    return "You cancelled the wallet request. No payment was made.";
  if (e.code === "INSUFFICIENT_FUNDS")
    return "Your wallet needs enough test ETH for the deposit and transaction fee.";
  const names: Record<string, string> = {
    Unauthorized: "This wallet is not allowed to perform that action.",
    InvalidState:
      "This milestone has changed. Refresh and check its current status.",
    PaymentFailed:
      "The recipient rejected the payment. Settlement was reverted; funds remain locked.",
    IncorrectFunding: "The deposit must equal the sum of the milestones.",
    InvalidParticipants:
      "Client, contributor, and arbitrator must be different, nonzero addresses.",
    InvalidToken: "Choose a valid deployed ERC-20 token.",
    UnsupportedTokenBehavior:
      "This token changes the transferred amount and is not supported by Pact.",
  };
  if (e.revert?.name && names[e.revert.name]) return names[e.revert.name];
  return (
    e.shortMessage ||
    e.message ||
    "Something went wrong. Try refreshing the agreement."
  ).slice(0, 260);
}
