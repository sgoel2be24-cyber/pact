"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, ContractFactory, formatEther } from "ethers";
import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import abi from "@/lib/abi.json";
import code from "@/lib/deployment-code.json";
import { friendlyError } from "@/lib/escrow";

const storageKey = "pact-sepolia-deployment-v1";
type Record = {
  chainId: number;
  address: string;
  block: number;
  transaction: string;
};
type Estimate = { address: string; balance: string; maximumFee: string };

export default function Deployment() {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [hash, setHash] = useState("");
  const [record, setRecord] = useState<Record | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null);
  function checkWallet() {
    setWalletAvailable(Boolean(window.ethereum));
  }
  useEffect(() => {
    checkWallet();
    const timer = window.setTimeout(checkWallet, 1000);
    window.addEventListener("focus", checkWallet);
    window.addEventListener("ethereum#initialized", checkWallet);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", checkWallet);
      window.removeEventListener("ethereum#initialized", checkWallet);
    };
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && /^0x[0-9a-fA-F]{64}$/.test(saved)) setHash(saved);
    } catch {}
  }, []);

  async function provider() {
    if (!window.ethereum)
      throw new Error(
        "Open this page in Chrome with MetaMask installed and unlocked.",
      );
    if (
      Number(await window.ethereum.request({ method: "eth_chainId" })) !==
      11155111
    ) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    }
    if (
      Number(await window.ethereum.request({ method: "eth_chainId" })) !==
      11155111
    )
      throw new Error("Deployment is allowed only on Sepolia.");
    return new BrowserProvider(window.ethereum);
  }

  async function inspect(p: BrowserProvider, transaction: string) {
    const receipt = await p.getTransactionReceipt(transaction);
    if (!receipt) {
      setMessage(
        "Transaction is still pending or not yet available. Check again after confirmation.",
      );
      return;
    }
    if (receipt.status !== 1)
      throw new Error(
        "This transaction failed. No successful deployment was recorded.",
      );
    if (!receipt.contractAddress)
      throw new Error("This transaction is not a contract deployment.");
    const tx = await p.getTransaction(transaction);
    const deployed = await p.getCode(receipt.contractAddress);
    if (
      !tx ||
      tx.data.toLowerCase() !== code.bytecode.toLowerCase() ||
      deployed.toLowerCase() !== code.deployedBytecode.toLowerCase()
    )
      throw new Error(
        "Deployed code does not match this Pact build. Do not configure the app with it.",
      );
    setRecord({
      chainId: 11155111,
      address: receipt.contractAddress,
      block: receipt.blockNumber,
      transaction: receipt.hash,
    });
    setMessage(
      "Deployment confirmed. The deployed code matches this build. Explorer verification is the next step.",
    );
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(friendlyError(e));
      document
        .getElementById("wallet-feedback")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setBusy(false);
    }
  }
  async function estimateDeployment() {
    await run(async () => {
      setEstimate(null);
      const p = await provider();
      await p.send("eth_requestAccounts", []);
      const signer = await p.getSigner();
      const request = await new ContractFactory(
        abi,
        code.bytecode,
        signer,
      ).getDeployTransaction();
      const gas = await signer.estimateGas(request);
      const fees = await p.getFeeData();
      const price = fees.maxFeePerGas ?? fees.gasPrice;
      if (!price)
        throw new Error("Could not estimate the network fee. Try again.");
      const balance = await p.getBalance(await signer.getAddress());
      const maximum = ((gas * 120n) / 100n) * price;
      setEstimate({
        address: await signer.getAddress(),
        balance: formatEther(balance),
        maximumFee: formatEther(maximum),
      });
      if (balance < maximum)
        throw new Error(
          "This account needs more Sepolia test ETH before deployment.",
        );
      setMessage(
        "Review the account and estimated fee below. MetaMask will show the final transaction before you approve it.",
      );
    });
  }
  async function deploy() {
    await run(async () => {
      const p = await provider();
      const signer = await p.getSigner();
      if (
        !estimate ||
        (await signer.getAddress()).toLowerCase() !==
          estimate.address.toLowerCase()
      )
        throw new Error(
          "The wallet account changed. Check the deployment fee again.",
        );
      if (hash)
        throw new Error(
          "A deployment transaction already exists. Check that transaction before deploying again.",
        );
      setMessage(
        "Confirm the contract deployment in MetaMask. Only a network fee is required; no job funds are deposited.",
      );
      const contract = await new ContractFactory(
        abi,
        code.bytecode,
        signer,
      ).deploy();
      const tx = contract.deploymentTransaction();
      if (!tx) throw new Error("No deployment transaction returned.");
      setHash(tx.hash);
      try {
        localStorage.setItem(storageKey, tx.hash);
      } catch {}
      setMessage("Deployment submitted. Waiting for Sepolia confirmation…");
      await tx.wait();
      await inspect(p, tx.hash);
    });
  }
  function download() {
    if (!record) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "pact-sepolia-deployment.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="deployment-page">
      <a className="text-button" href="/">
        <ArrowLeft size={14} />
        Back to Pact
      </a>
      <p className="eyebrow">BUILDER SETUP / SEPOLIA ONLY</p>
      <h1>
        Take your pact
        <br />
        to the testnet.
      </h1>
      <p className="guide-intro">
        Deploy the tested escrow contract with MetaMask. Your private key stays
        in your wallet.
      </p>
      <section className="deployment-panel wallet-onboarding">
        <div className="card-title">
          <h3>New to wallets? Start here.</h3>
          <span>No crypto purchase or Sepolia login is needed.</span>
        </div>
        <p className="reference-text">
          <strong>MetaMask</strong> is a browser wallet: it holds your test
          account and asks you to approve transactions. <strong>Sepolia</strong>{" "}
          is the practice network where we will demonstrate Pact. Its test ETH
          has no real-world value.
        </p>
        <ol className="setup-steps">
          <li>
            Open regular Google Chrome and install MetaMask from its official
            website.
          </li>
          <li>
            Create a new wallet inside the extension. Keep any recovery phrase
            private; never paste it into Pact or this chat.
          </li>
          <li>
            Open this page in that same Chrome browser:{" "}
            <code>http://127.0.0.1:3100/deploy</code>
          </li>
          <li>
            Then we will enable Sepolia and obtain free test ETH before
            deploying.
          </li>
        </ol>
        <a
          className="primary"
          href="https://metamask.io/download"
          target="_blank"
          rel="noreferrer"
        >
          Get MetaMask from the official site <ExternalLink size={14} />
        </a>
      </section>
      <section className="deployment-panel">
        <div className="card-title">
          <h3>1. Check your wallet</h3>
          <span>Ethereum Sepolia · Chain 11155111 · Test funds only</span>
        </div>
        <p className="reference-text">
          Use a dedicated test wallet. You will also need separate client,
          contributor, and arbitrator accounts for the demo.
        </p>
        <div
          id="wallet-feedback"
          className="wallet-feedback"
          aria-live="polite"
        >
          {walletAvailable === null ? (
            <p>Checking this browser for a wallet…</p>
          ) : walletAvailable ? (
            <p>A browser wallet is available. Unlock MetaMask to continue.</p>
          ) : (
            <>
              <strong>No browser wallet detected.</strong>
              <p>
                This page cannot connect until a wallet extension is available
                in this browser. If you are using the Codex preview, open the
                address in regular Chrome after installing MetaMask.
              </p>
              <button className="text-button" onClick={checkWallet}>
                I installed it — check again
              </button>
            </>
          )}
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          {busy && (
            <p role="status">
              Waiting for the wallet or network. Check the MetaMask extension
              for a request.
            </p>
          )}
        </div>
        <button
          className="secondary"
          onClick={estimateDeployment}
          disabled={busy || !!hash || walletAvailable !== true}
        >
          <Wallet size={16} />
          {walletAvailable === false
            ? "Install a wallet to connect"
            : busy
              ? "Checking wallet…"
              : "Connect & estimate fee"}
        </button>
        {estimate && (
          <dl>
            <dt>Deploying account</dt>
            <dd>{estimate.address}</dd>
            <dt>Test ETH balance</dt>
            <dd>{estimate.balance} ETH</dd>
            <dt>Estimated fee ceiling, including 20% gas margin</dt>
            <dd>{estimate.maximumFee} ETH</dd>
          </dl>
        )}
        <a
          className="reference-link"
          href="https://support.metamask.io/configure/networks/how-to-view-testnets-in-metamask/"
          target="_blank"
          rel="noreferrer"
        >
          Show Sepolia in MetaMask <ExternalLink size={12} />
        </a>
      </section>
      <section className="deployment-panel">
        <div className="card-title">
          <h3>2. Deploy PactEscrow</h3>
          <span>No token, no admin owner, no job deposit.</span>
        </div>
        <p className="reference-text">
          MetaMask will ask you to approve this deployment. Review that its
          network is Sepolia.
        </p>
        <button
          className="primary"
          onClick={deploy}
          disabled={
            busy ||
            !estimate ||
            !!hash ||
            Number(estimate.balance) < Number(estimate.maximumFee)
          }
        >
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <ShieldCheck size={16} />
          )}
          Deploy on Sepolia
        </button>
        {hash && (
          <div className="deployment-result">
            <a
              className="reference-link"
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
            >
              View deployment transaction <ExternalLink size={12} />
            </a>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => run(async () => inspect(await provider(), hash))}
            >
              Check confirmation
            </button>
          </div>
        )}
        {message && (
          <p role="status" className="form-note">
            {message}
          </p>
        )}
      </section>
      {record && (
        <section className="deployment-panel">
          <CheckCheck size={25} />
          <h2>Contract deployed.</h2>
          <p className="reference-text">
            Share this public transaction hash in our task so I can configure
            the app and prepare explorer verification. No secret information is
            needed.
          </p>
          <p className="deployment-hash">{record.transaction}</p>
          <button className="secondary" onClick={download}>
            Download deployment record
          </button>
          <a
            className="reference-link"
            href={`https://sepolia.etherscan.io/address/${record.address}`}
            target="_blank"
            rel="noreferrer"
          >
            Open contract <ExternalLink size={12} />
          </a>
        </section>
      )}
    </main>
  );
}
