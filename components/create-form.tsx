"use client";
import { useEffect, useState, type FormEvent } from "react";
import { isAddress, parseUnits } from "ethers";
import { Coins, LoaderCircle, LockKeyhole } from "lucide-react";
import {
  demoSigner,
  formatAmount,
  friendlyError,
  mockTokenAddress,
  type Asset,
} from "@/lib/escrow";
import IpfsUpload from "./ipfs-upload";

export type CreateValues = {
  title: string;
  scope: string;
  freelancer: string;
  arbitrator: string;
  titles: string[];
  amounts: bigint[];
  asset: Asset;
};

const nativeAsset: Asset = {
  symbol: "ETH",
  decimals: 18,
  token: "0x0000000000000000000000000000000000000000",
};
const mockAsset: Asset = {
  symbol: "mUSDC",
  decimals: 6,
  token: mockTokenAddress,
};

export default function CreateForm({
  address,
  busy,
  usingDemo,
  onCreate,
}: {
  address: string;
  busy: boolean;
  usingDemo: boolean;
  onCreate: (values: CreateValues) => Promise<void>;
}) {
  const [count, setCount] = useState(3);
  const [amounts, setAmounts] = useState(["0.012", "0.008", "0.005"]);
  const [asset, setAsset] = useState(nativeAsset);
  const [scope, setScope] = useState("");
  const [error, setError] = useState("");
  const [defaults, setDefaults] = useState({ freelancer: "", arbitrator: "" });
  useEffect(() => {
    if (usingDemo)
      void Promise.all([demoSigner(1), demoSigner(2)])
        .then(async (signers) =>
          setDefaults({
            freelancer: await signers[0].getAddress(),
            arbitrator: await signers[1].getAddress(),
          }),
        )
        .catch(() => {});
  }, [usingDemo]);

  let total = 0n;
  try {
    total = amounts
      .slice(0, count)
      .reduce(
        (sum, value) => sum + parseUnits(value || "0", asset.decimals),
        0n,
      );
  } catch {
    /* Invalid inputs receive explicit submit validation. */
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const title = String(form.get("title") || "").trim();
      const freelancer = String(form.get("freelancer") || "").trim();
      const arbitrator = String(form.get("arbitrator") || "").trim();
      const zero = "0x0000000000000000000000000000000000000000";
      if (
        ![freelancer, arbitrator].every(
          (candidate) =>
            isAddress(candidate) && candidate.toLowerCase() !== zero,
        ) ||
        new Set(
          [address, freelancer, arbitrator].map((value) => value.toLowerCase()),
        ).size !== 3
      )
        throw new Error(
          "Use three different, valid addresses for the client, contributor, and arbitrator.",
        );
      const titles = Array.from({ length: count }, (_, index) =>
        String(form.get(`title-${index}`) || "").trim(),
      );
      const values = amounts.slice(0, count).map((value) => {
        const pattern = new RegExp(`^\\d+(\\.\\d{1,${asset.decimals}})?$`);
        if (!pattern.test(value))
          throw new Error(
            `Use a positive ${asset.symbol} amount with at most ${asset.decimals} decimal places.`,
          );
        const amount = parseUnits(value, asset.decimals);
        if (amount <= 0n)
          throw new Error("Every milestone needs a positive amount.");
        return amount;
      });
      if (!title || !scope.trim() || titles.some((value) => !value))
        throw new Error("Add a title, scope, and title for every milestone.");
      if (
        [title, ...titles].some(
          (value) => new TextEncoder().encode(value).length > 120,
        ) ||
        new TextEncoder().encode(scope.trim()).length > 1000
      )
        throw new Error(
          "Keep titles under 120 bytes and scope under 1,000 bytes.",
        );
      await onCreate({
        title,
        scope: scope.trim(),
        freelancer,
        arbitrator,
        titles,
        amounts: values,
        asset,
      });
    } catch (cause) {
      setError(friendlyError(cause));
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="form-fields">
        <label className="form-field">
          Agreement name
          <input
            name="title"
            required
            maxLength={120}
            placeholder="e.g. Open-source SDK integration"
          />
        </label>
        <label className="form-field">
          Scope & acceptance criteria
          <textarea
            name="scope"
            required
            maxLength={1000}
            rows={3}
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            placeholder="Describe the scope, paste a link, or pin the specification to IPFS."
          />
          <span>
            This record is public. Never upload secrets or personal data.
          </span>
        </label>
        <IpfsUpload disabled={busy} onUploaded={setScope} />
        <label className="form-field">
          Payment asset
          <select
            value={asset.token}
            onChange={(event) => {
              const next =
                event.target.value === mockTokenAddress
                  ? mockAsset
                  : nativeAsset;
              setAsset(next);
              setAmounts(
                next.symbol === "ETH"
                  ? ["0.012", "0.008", "0.005"]
                  : ["125", "75", "50"],
              );
            }}
          >
            <option value={nativeAsset.token}>Native ETH</option>
            {isAddress(mockTokenAddress) && (
              <option value={mockTokenAddress}>Mock USDC (mUSDC)</option>
            )}
          </select>
          <span>
            mUSDC is a valueless 6-decimal test token. Token funding uses
            approve, then transferFrom.
          </span>
        </label>
        <div className="two-fields">
          <label className="form-field">
            Contributor wallet
            <input
              name="freelancer"
              key={`f-${defaults.freelancer}`}
              defaultValue={defaults.freelancer}
              required
              placeholder="0x…"
            />
          </label>
          <label className="form-field">
            Agreed arbitrator wallet
            <input
              name="arbitrator"
              key={`a-${defaults.arbitrator}`}
              defaultValue={defaults.arbitrator}
              required
              placeholder="0x…"
            />
          </label>
        </div>
        <div className="form-section-title">
          <h3>Define the milestones</h3>
          <button
            type="button"
            className="text-button"
            onClick={() => setCount(count === 3 ? 2 : 3)}
          >
            {count === 3 ? "Use 2 milestones" : "Add third milestone"}
          </button>
        </div>
        {Array.from({ length: count }, (_, index) => (
          <div className="milestone-input" key={index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <label className="sr-only" htmlFor={`milestone-title-${index}`}>
              Milestone {index + 1} title
            </label>
            <input
              id={`milestone-title-${index}`}
              name={`title-${index}`}
              required
              maxLength={120}
              placeholder={
                ["Implementation", "Tests & review", "Documentation"][index]
              }
            />
            <label className="sr-only" htmlFor={`milestone-amount-${index}`}>
              Milestone {index + 1} amount in {asset.symbol}
            </label>
            <input
              id={`milestone-amount-${index}`}
              className="amount-input"
              inputMode="decimal"
              value={amounts[index]}
              required
              onChange={(event) =>
                setAmounts((current) =>
                  current.map((value, amountIndex) =>
                    index === amountIndex ? event.target.value : value,
                  ),
                )
              }
            />
            <small>{asset.symbol}</small>
          </div>
        ))}
      </fieldset>
      <div className="funding-total">
        <div>
          <span>Total to lock</span>
          <small>
            {asset.symbol === "ETH"
              ? "Plus the network transaction fee"
              : "Two confirmations: allowance, then escrow funding"}
          </small>
        </div>
        <strong>
          {formatAmount(total, asset)} <small>{asset.symbol}</small>
        </strong>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <p className="form-note">
        {asset.symbol === "ETH" ? (
          <LockKeyhole size={14} />
        ) : (
          <Coins size={14} />
        )}
        This locks the full amount. Funds release only on approval or
        arbitration; there is no automatic timeout or cancellation in this
        prototype.
      </p>
      <button type="submit" className="primary full-width" disabled={busy}>
        {busy ? (
          <LoaderCircle className="spin" size={16} />
        ) : (
          <LockKeyhole size={16} />
        )}
        {busy ? "Funding agreement…" : "Create & fund agreement"}
      </button>
    </form>
  );
}
