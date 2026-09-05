"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { type ContractTransactionResponse, type Signer } from "ethers";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FolderClosed,
  Gavel,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import {
  assertWalletNetwork,
  configured,
  contractAddress,
  demoSigner,
  erc20,
  escrow,
  explorer,
  fetchReputation,
  fetchActivity,
  fetchJobs,
  fetchMilestones,
  formatAmount,
  friendlyError,
  isLocalChain,
  localDemoAllowed,
  networkName,
  roleFor,
  shortAddress,
  walletSigner,
  type Activity,
  type Job,
  type Milestone,
  type Reputation,
} from "@/lib/escrow";

import { Stat, Reference, TransactionLink, Person, Modal } from "./primitives";
import MilestoneCard from "./milestone-card";
import CreateForm, { type CreateValues } from "./create-form";
import Guide from "./guide";
import IpfsUpload from "./ipfs-upload";

type Action = {
  kind: "deliver" | "approve" | "dispute" | "release" | "refund";
  id: number;
  item: Milestone;
};
type Notice = {
  state: "signing" | "pending" | "success" | "error";
  title: string;
  detail: string;
  hash?: string;
};
const roleNames = ["Client", "Contributor", "Arbitrator"] as const;

export default function Workspace() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [items, setItems] = useState<Milestone[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState("");
  const [demoRole, setDemoRole] = useState(0);
  const [usingDemo, setUsingDemo] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [view, setView] = useState<"workspace" | "guide">("workspace");
  const [action, setAction] = useState<Action | null>(null);
  const [actionText, setActionText] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const detailsRequest = useRef(0);
  const job = jobs.find((j) => j.id === selectedId);
  const role = job && address ? roleFor(job, address) : "Observer";

  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      const next = await fetchJobs();
      setJobs(next);
      setSelectedId((current) =>
        current !== null && next.some((j) => j.id === current)
          ? current
          : (next[0]?.id ?? null),
      );
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setLoadError(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (selectedId === null) return;
    const request = ++detailsRequest.current;
    setDetailsLoading(true);
    setItems([]);
    setActivity([]);
    setReputation(null);
    setActivityError("");
    void Promise.allSettled([
      fetchMilestones(selectedId),
      fetchActivity(selectedId),
      fetchReputation(
        jobs.find((candidate) => candidate.id === selectedId)!.freelancer,
      ),
    ]).then((results) => {
      if (request !== detailsRequest.current) return;
      const [milestones, events, reputationResult] = results;
      if (milestones.status === "fulfilled") setItems(milestones.value);
      else setLoadError(friendlyError(milestones.reason));
      if (events.status === "fulfilled") setActivity(events.value);
      else setActivityError(friendlyError(events.reason));
      if (reputationResult.status === "fulfilled")
        setReputation(reputationResult.value);
      setDetailsLoading(false);
    });
    return () => {
      ++detailsRequest.current;
    };
  }, [selectedId, refreshKey, jobs]);

  useEffect(() => {
    if (action) setActionText("");
  }, [action]);

  const connectDemo = useCallback(async (index: number) => {
    setConnecting(true);
    try {
      const s = await demoSigner(index);
      setSigner(s);
      setAddress(await s.getAddress());
      setDemoRole(index);
      setUsingDemo(true);
    } catch (error) {
      setNotice({
        state: "error",
        title: "Could not connect",
        detail: friendlyError(error),
      });
    } finally {
      setConnecting(false);
    }
  }, []);
  useEffect(() => {
    if (localDemoAllowed()) void connectDemo(0);
  }, [connectDemo]);
  useEffect(() => {
    const wallet = window.ethereum;
    const clear = () => {
      if (!usingDemo) {
        setSigner(null);
        setAddress("");
        setAction(null);
        setCreating(false);
        setNotice({
          state: "error",
          title: "Wallet changed",
          detail:
            "Reconnect your wallet to continue with the correct account and network.",
        });
      }
    };
    wallet?.on?.("accountsChanged", clear);
    wallet?.on?.("chainChanged", clear);
    return () => {
      wallet?.removeListener?.("accountsChanged", clear);
      wallet?.removeListener?.("chainChanged", clear);
    };
  }, [usingDemo]);

  async function connectWallet() {
    setConnecting(true);
    try {
      const s = await walletSigner();
      setSigner(s);
      setAddress(await s.getAddress());
      setUsingDemo(false);
    } catch (error) {
      setNotice({
        state: "error",
        title: "Wallet connection",
        detail: friendlyError(error),
      });
    } finally {
      setConnecting(false);
    }
  }

  async function transact(
    label: string,
    send: (s: Signer) => Promise<ContractTransactionResponse>,
  ) {
    if (!signer) {
      setNotice({
        state: "error",
        title: "Connect a wallet",
        detail: "Connect the account assigned to this action first.",
      });
      return;
    }
    setBusy(true);
    setNotice({
      state: "signing",
      title: usingDemo
        ? "Submitting to the local chain"
        : "Confirm in your wallet",
      detail: label,
    });
    try {
      if (!usingDemo) await assertWalletNetwork();
      const tx = await send(signer);
      setNotice({
        state: "pending",
        title: "Transaction submitted",
        detail: "Waiting for network confirmation. Keep this window open.",
        hash: tx.hash,
      });
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1)
        throw new Error(
          "Transaction was not successful. Refresh to check the agreement.",
        );
      setAction(null);
      setCreating(false);
      if (label === "Agreement funded") setSelectedId(null);
      setNotice({
        state: "success",
        title: label,
        detail: `Confirmed on ${networkName} · block ${receipt.blockNumber.toLocaleString()}`,
        hash: receipt.hash,
      });
      await refresh();
    } catch (error) {
      setNotice({
        state: "error",
        title: "Action not completed",
        detail: friendlyError(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job || !action) return;
    const text = actionText.trim();
    if (action.kind !== "approve" && !text) return;
    const { id, kind } = action;
    const labels = {
      deliver: "Delivery submitted",
      approve: "Payment released",
      dispute: "Dispute opened",
      release: "Dispute resolved · payment released",
      refund: "Dispute resolved · payment refunded",
    };
    await transact(labels[kind], (s) => {
      const c = escrow(s);
      if (kind === "deliver") return c.deliver(job.id, id, text);
      if (kind === "approve") return c.approve(job.id, id);
      if (kind === "dispute") return c.dispute(job.id, id, text);
      return c.resolve(job.id, id, kind === "release", text);
    });
  }

  async function createAgreement(values: CreateValues) {
    if (!signer) return;
    setBusy(true);
    const total = values.amounts.reduce((sum, amount) => sum + amount, 0n);
    try {
      if (!usingDemo) await assertWalletNetwork();
      const c = escrow(signer);
      let tx: ContractTransactionResponse;
      if (values.asset.symbol === "ETH") {
        setNotice({
          state: "signing",
          title: usingDemo
            ? "Submitting to the local chain"
            : "Confirm in your wallet",
          detail: "Fund the agreement with native ETH.",
        });
        tx = await c.createJob(
          values.freelancer,
          values.arbitrator,
          values.title,
          values.scope,
          values.titles,
          values.amounts,
          { value: total },
        );
      } else {
        const token = erc20(values.asset.token, signer);
        const owner = await signer.getAddress();
        const allowance: bigint = await token.allowance(owner, contractAddress);
        if (allowance < total) {
          setNotice({
            state: "signing",
            title: "Step 1 of 2 · approve mUSDC",
            detail: `Approve exactly ${formatAmount(total, values.asset)} ${values.asset.symbol} for this agreement.`,
          });
          const approval = await token.approve(contractAddress, total);
          setNotice({
            state: "pending",
            title: "Allowance submitted",
            detail: "Waiting for confirmation before funding the agreement.",
            hash: approval.hash,
          });
          const approvalReceipt = await approval.wait();
          if (!approvalReceipt || approvalReceipt.status !== 1)
            throw new Error("Token approval was not successful.");
        }
        setNotice({
          state: "signing",
          title: "Step 2 of 2 · fund agreement",
          detail: "Confirm the transferFrom escrow deposit.",
        });
        tx = await c.createTokenJob(
          values.freelancer,
          values.arbitrator,
          values.asset.token,
          values.title,
          values.scope,
          values.titles,
          values.amounts,
        );
      }
      setNotice({
        state: "pending",
        title: "Transaction submitted",
        detail: "Waiting for the funded agreement confirmation.",
        hash: tx.hash,
      });
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1)
        throw new Error("Agreement funding was not successful.");
      setCreating(false);
      setSelectedId(null);
      setNotice({
        state: "success",
        title: "Agreement funded",
        detail: `Confirmed on ${networkName} · block ${receipt.blockNumber.toLocaleString()}`,
        hash: receipt.hash,
      });
      await refresh();
    } catch (error) {
      setNotice({
        state: "error",
        title: "Agreement not funded",
        detail: friendlyError(error),
      });
    } finally {
      setBusy(false);
    }
  }

  const displayAsset = job?.asset ?? { symbol: "ETH", decimals: 18, token: "" };
  const totals = {
    locked: job ? job.total - job.released - job.refunded : 0n,
    released: job?.released ?? 0n,
    refunded: job?.refunded ?? 0n,
  };
  const settledCount = items.filter((m) => m.status >= 3).length;
  const progress =
    job && job.total > 0n
      ? Number(((job.released + job.refunded) * 10000n) / job.total) / 100
      : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Pact home">
          <span className="brand-mark">
            <span />
          </span>
          pact<span className="brand-period">.</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={view === "workspace" ? "nav-item active" : "nav-item"}
            onClick={() => setView("workspace")}
          >
            <LayoutGrid size={18} />
            Agreements<span className="nav-count">{jobs.length}</span>
          </button>
          <button
            className={view === "guide" ? "nav-item active" : "nav-item"}
            onClick={() => setView("guide")}
          >
            <BookOpen size={18} />
            How Pact works
          </button>
        </nav>
        <div className="sidebar-note">
          <div className="tiny-shield">
            <ShieldCheck size={21} />
          </div>
          <h3>
            A little more trust.
            <br />A lot less guesswork.
          </h3>
          <p>Clear milestones. Protected funds. Every decision on record.</p>
          <button onClick={() => setView("guide")}>
            See the workflow <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="network-dot" />
          {networkName}
          <span className="testnet-tag">TESTNET</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-brand"
              onClick={() => setView("workspace")}
            >
              pact<span>.</span>
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {view === "workspace" ? "Agreements" : "How it works"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              aria-label="Explain the payment workflow"
              onClick={() => setView(view === "guide" ? "workspace" : "guide")}
            >
              <BookOpen size={17} />
            </button>
            <button
              className="wallet-button"
              onClick={connectWallet}
              disabled={busy || connecting}
            >
              <Wallet size={16} />
              {connecting
                ? "Connecting…"
                : address
                  ? shortAddress(address)
                  : "Connect wallet"}
              <span className="wallet-dot" />
            </button>
          </div>
        </header>
        {isLocalChain && (
          <div className="demo-bar">
            <div>
              <span className="demo-badge">LOCAL DEMO</span>
              <span>Real local transactions · disposable test funds</span>
            </div>
            <label>
              Act as{" "}
              <select
                aria-label="Demo role"
                value={usingDemo ? demoRole : ""}
                disabled={busy || connecting}
                onChange={(event) =>
                  void connectDemo(Number(event.target.value))
                }
              >
                {!usingDemo && (
                  <option value="" disabled>
                    Wallet connected
                  </option>
                )}
                {roleNames.map((r, i) => (
                  <option value={i} key={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
        )}

        <main>
          <section className="proof-strip" aria-label="Project proof">
            <strong>
              <ShieldCheck size={16} /> Project proof
            </strong>
            {explorer(contractAddress, "address") ? (
              <a
                href={explorer(contractAddress, "address")!}
                target="_blank"
                rel="noreferrer"
              >
                Configured Sepolia contract <ExternalLink size={13} />
              </a>
            ) : (
              <span>Local contract active</span>
            )}
            <a
              href="https://github.com/sgoel2be24-cyber/pact"
              target="_blank"
              rel="noreferrer"
            >
              Open-source repository <ExternalLink size={13} />
            </a>
            <a
              href="https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml"
              target="_blank"
              rel="noreferrer"
            >
              Tests &amp; build checks <ExternalLink size={13} />
            </a>
          </section>
          {view === "guide" ? (
            <Guide onBack={() => setView("workspace")} />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    GOOD WORK STARTS WITH A CLEAR AGREEMENT
                  </p>
                  <h1>
                    Work agreed.
                    <br className="mobile-break" /> Payment protected.
                  </h1>
                  <p className="page-subtitle">
                    A shared place for your milestones, payments, and peace of
                    mind.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => setCreating(true)}
                  disabled={!signer || !configured || busy}
                >
                  <Plus size={17} />
                  New agreement
                </button>
              </div>
              {!configured && (
                <div className="setup-card">
                  <ShieldCheck size={24} />
                  <div>
                    <h3>Your workspace is ready for a contract.</h3>
                    <p>
                      Deploy PactEscrow on Sepolia and configure its address,
                      RPC URL, and deployment block to enable agreements. See
                      the project README for the setup steps.
                    </p>
                  </div>
                </div>
              )}
              {loadError && (
                <div role="alert" className="error-banner">
                  <span>
                    {loadError}{" "}
                    {jobs.length > 0 && "Displayed values may be out of date."}
                  </span>
                  <button onClick={() => void refresh()}>
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              )}
              <section
                className="stats-grid"
                aria-label="Selected agreement payment totals"
              >
                <Stat
                  label="PROTECTED IN ESCROW"
                  value={formatAmount(totals.locked, displayAsset)}
                  unit={displayAsset.symbol}
                  icon={<LockKeyhole size={18} />}
                  note="Ready when the work is"
                  accent
                />
                <Stat
                  label="RELEASED TO CONTRIBUTORS"
                  value={formatAmount(totals.released, displayAsset)}
                  unit={displayAsset.symbol}
                  icon={<ArrowUpRight size={19} />}
                  note="Good work, paid for"
                />
                <Stat
                  label="RETURNED TO CLIENTS"
                  value={formatAmount(totals.refunded, displayAsset)}
                  unit={displayAsset.symbol}
                  icon={<ArrowDownLeft size={19} />}
                  note="Resolutions with a clear record"
                />
              </section>
              <div className="section-heading">
                <div>
                  <h2>
                    Agreements <span>{jobs.length}</span>
                  </h2>
                  <p>Follow the work. See exactly where the funds stand.</p>
                </div>
                <button
                  className="text-button"
                  disabled={busy || loading}
                  onClick={() => void refresh()}
                  aria-label="Refresh agreements"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="empty-state">
                  <LoaderCircle className="spin" />
                  <h3>Reading your agreements…</h3>
                  <p>Connecting to {networkName}.</p>
                </div>
              ) : !job ? (
                <div className="empty-state">
                  <FolderClosed size={36} />
                  <h3>Your next collaboration starts here.</h3>
                  <p>
                    Agree on the scope, choose your people, and fund the
                    milestones.
                  </p>
                  <button
                    className="primary"
                    disabled={!signer || !configured}
                    onClick={() => setCreating(true)}
                  >
                    <Plus size={16} />
                    Create an agreement
                  </button>
                </div>
              ) : (
                <>
                  {jobs.length > 1 && (
                    <div className="job-tabs" aria-label="Select agreement">
                      {jobs.map((j) => (
                        <button
                          className={j.id === selectedId ? "selected" : ""}
                          key={j.id}
                          onClick={() => {
                            setSelectedId(j.id);
                            setAction(null);
                          }}
                          disabled={busy}
                        >
                          <span>#{String(j.id + 1).padStart(3, "0")}</span>
                          {j.title}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="detail-grid">
                    <div className="agreement-column">
                      <section className="agreement-card">
                        <div className="agreement-top">
                          <div className="folder-icon">
                            <FolderClosed size={22} />
                          </div>
                          <div>
                            <p className="small-label">
                              AGREEMENT #{String(job.id + 1).padStart(3, "0")}
                            </p>
                            <h2>{job.title}</h2>
                          </div>
                          <span
                            className={`status-pill ${job.total === job.released + job.refunded ? "released" : "funded"}`}
                          >
                            <span />
                            {job.total === job.released + job.refunded
                              ? "Settled"
                              : "In progress"}
                          </span>
                        </div>
                        <div className="scope-block">
                          <span>THE AGREEMENT</span>
                          <Reference value={job.agreementRef} />
                        </div>
                        <div className="agreement-summary">
                          <div>
                            <span>Total funded</span>
                            <strong>
                              {formatAmount(job.total, job.asset)}{" "}
                              <small>{job.asset.symbol}</small>
                            </strong>
                          </div>
                          <div>
                            <span>Milestones settled</span>
                            <strong>
                              {settledCount}
                              <small> / {items.length || "—"}</small>
                            </strong>
                          </div>
                          <div>
                            <span>Your role</span>
                            <strong className="role-text">{role}</strong>
                          </div>
                        </div>
                        <div
                          className="progress-track"
                          aria-label={`${progress}% of funding settled`}
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <div className="progress-caption">
                          <span>
                            {formatAmount(
                              job.released + job.refunded,
                              job.asset,
                            )}{" "}
                            {job.asset.symbol} settled
                          </span>
                          <span>
                            {formatAmount(
                              job.total - job.released - job.refunded,
                              job.asset,
                            )}{" "}
                            {job.asset.symbol} protected
                          </span>
                        </div>
                      </section>
                      <div className="milestone-heading">
                        <h3>The work, step by step</h3>
                        <span>Each payment stands on its own</span>
                      </div>
                      {detailsLoading ? (
                        <div className="loading-card">
                          <LoaderCircle size={18} className="spin" />
                          Reading milestone state…
                        </div>
                      ) : (
                        items.map((item, id) => (
                          <MilestoneCard
                            key={`${job.id}-${id}`}
                            item={item}
                            asset={job.asset}
                            id={id}
                            role={role}
                            busy={busy || !!loadError}
                            onAction={(kind) => setAction({ kind, id, item })}
                          />
                        ))
                      )}
                      <div className="protection-note">
                        <ShieldCheck size={17} />
                        <p>
                          Funds move only on client approval or an arbitrator’s
                          decision. Every payment is recorded on {networkName}.
                        </p>
                      </div>
                    </div>

                    <aside className="context-column">
                      <section className="people-card">
                        <div className="card-title">
                          <h3>People in this pact</h3>
                          <span>3 roles. One agreement.</span>
                        </div>
                        <Person
                          role="Client"
                          address={job.client}
                          current={address}
                          color="peach"
                        />
                        <Person
                          role="Contributor"
                          address={job.freelancer}
                          current={address}
                          color="sage"
                        />
                        <div className="reputation-card">
                          <span>ON-CHAIN REPUTATION</span>
                          {reputation?.supported === false ? (
                            <p>
                              Available after the stretch contract is deployed.
                            </p>
                          ) : (
                            <>
                              <strong>{reputation?.score ?? "—"} points</strong>
                              <p>
                                {reputation?.releasedMilestones ?? "—"} released
                                milestones · {reputation?.completedJobs ?? "—"}{" "}
                                completed job
                                {reputation?.completedJobs === 1 ? "" : "s"}
                              </p>
                              <small>
                                1 per release + 5 per fully released job
                              </small>
                            </>
                          )}
                        </div>
                        <Person
                          role="Arbitrator"
                          address={job.arbitrator}
                          current={address}
                          color="lavender"
                        />
                        <div className="arbitrator-note">
                          <Gavel size={14} />
                          <span>
                            The chosen arbitrator makes the final call on
                            disputes.
                          </span>
                        </div>
                      </section>
                      <section className="activity-card">
                        <div className="card-title">
                          <h3>Nothing behind the scenes</h3>
                          <span>Your on-chain activity trail</span>
                        </div>
                        {activityError ? (
                          <p className="inline-error">
                            Activity unavailable: {activityError}
                          </p>
                        ) : activity.length === 0 ? (
                          <p className="muted small">
                            {detailsLoading
                              ? "Loading the record…"
                              : "No activity yet."}
                          </p>
                        ) : (
                          <ol className="timeline">
                            {activity.map((event, index) => (
                              <li key={event.key}>
                                <span
                                  className={`timeline-marker ${index === 0 ? "latest" : ""}`}
                                />{" "}
                                <div>
                                  <h4>{event.name}</h4>
                                  {event.milestoneId !== undefined && (
                                    <span className="activity-milestone">
                                      Milestone {event.milestoneId + 1}
                                    </span>
                                  )}
                                  <p>{event.detail}</p>
                                  <div className="event-meta">
                                    <time
                                      dateTime={new Date(
                                        event.timestamp * 1000,
                                      ).toISOString()}
                                    >
                                      {new Date(
                                        event.timestamp * 1000,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </time>
                                    <TransactionLink hash={event.hash} />
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}
                      </section>
                      <div className="contract-card">
                        <ShieldCheck size={16} />
                        <div>
                          <span>Funds held by the contract</span>
                          {explorer(contractAddress, "address") ? (
                            <a
                              href={explorer(contractAddress, "address")!}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {shortAddress(contractAddress)}{" "}
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="mono">
                              {shortAddress(contractAddress)}
                            </span>
                          )}
                          {job.token !==
                            "0x0000000000000000000000000000000000000000" && (
                            <span className="asset-contract">
                              {job.asset.symbol} · {shortAddress(job.token)}
                            </span>
                          )}
                        </div>
                      </div>
                    </aside>
                  </div>
                </>
              )}
              <footer>
                <span>
                  Built for clear agreements and better working relationships.
                </span>
                <span>PACT / HACKBLOX 2026</span>
              </footer>
            </>
          )}
        </main>
      </div>
      {notice && (
        <div
          className={`toast ${notice.state}`}
          role={notice.state === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <div className="toast-icon">
            {notice.state === "pending" || notice.state === "signing" ? (
              <LoaderCircle className="spin" size={20} />
            ) : notice.state === "success" ? (
              <CheckCheck size={21} />
            ) : (
              <CircleHelp size={21} />
            )}
          </div>
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.detail}</p>
            {notice.hash && <TransactionLink hash={notice.hash} />}
          </div>
          {!busy && (
            <button
              className="icon-button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {action && job && (
        <Modal
          title={actionTitle(action.kind)}
          subtitle={`Milestone ${action.id + 1} · ${action.item.title}`}
          busy={busy}
          onClose={() => setAction(null)}
        >
          <form onSubmit={submitAction}>
            <div className="action-amount">
              <span>
                {action.kind === "refund"
                  ? "Returning to client"
                  : action.kind === "approve" || action.kind === "release"
                    ? "Releasing to contributor"
                    : "Protected milestone amount"}
              </span>
              <strong>
                {formatAmount(action.item.amount, job.asset)}{" "}
                <small>{job.asset.symbol}</small>
              </strong>
            </div>
            {action.item.evidenceRef && (
              <div className="modal-evidence">
                <span>Submitted evidence</span>
                <Reference value={action.item.evidenceRef} />
              </div>
            )}
            {action.item.disputeReason && (
              <div className="modal-dispute">
                <span>Client’s dispute</span>
                <p>{action.item.disputeReason}</p>
              </div>
            )}
            {action.kind === "approve" ? (
              <p className="form-note">
                Confirm that this delivery meets the agreement. This transfers
                the milestone’s funds to the contributor and cannot be undone.
              </p>
            ) : (
              <label className="form-field">
                {action.kind === "deliver"
                  ? "Deliverable link or evidence reference"
                  : action.kind === "dispute"
                    ? "What does not meet the agreement?"
                    : "Explain your decision"}
                <textarea
                  name="text"
                  required
                  maxLength={1000}
                  rows={4}
                  placeholder={
                    action.kind === "deliver"
                      ? "https://github.com/… or ipfs://…"
                      : action.kind === "dispute"
                        ? "Be specific about the agreed acceptance criteria."
                        : "Explain how the evidence supports this release or refund."
                  }
                  disabled={busy}
                  value={actionText}
                  onChange={(event) => setActionText(event.target.value)}
                />
                <span>
                  {action.kind === "deliver"
                    ? "Use a public link or an IPFS reference. Do not include secrets."
                    : "Your explanation becomes part of the public on-chain record."}
                </span>
              </label>
            )}
            {action.kind === "deliver" && (
              <IpfsUpload disabled={busy} onUploaded={setActionText} />
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button className="primary" type="submit" disabled={busy}>
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : action.kind === "approve" || action.kind === "release" ? (
                  <ArrowUpRight size={16} />
                ) : action.kind === "refund" ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <Check size={16} />
                )}
                {busy ? "Confirming…" : actionTitle(action.kind)}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {creating && (
        <Modal
          title="Start with a clear agreement."
          subtitle="Agree on scope and participants before locking funds."
          busy={busy}
          onClose={() => setCreating(false)}
        >
          <CreateForm
            address={address}
            busy={busy}
            usingDemo={usingDemo}
            onCreate={createAgreement}
          />
        </Modal>
      )}
    </div>
  );
}

function actionTitle(kind: Action["kind"]) {
  return {
    deliver: "Submit delivery",
    approve: "Approve & release",
    dispute: "Open dispute",
    release: "Resolve & release",
    refund: "Resolve & refund",
  }[kind];
}
