"use client";
import { useEffect, useState, type FormEvent } from "react";
import { isAddress, parseEther } from "ethers";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { demoSigner, eth, friendlyError } from "@/lib/escrow";
export type CreateValues = {
  title: string;
  scope: string;
  freelancer: string;
  arbitrator: string;
  titles: string[];
  amounts: bigint[];
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
      .reduce((sum, value) => sum + parseEther(value || "0"), 0n);
  } catch {
    /* Invalid inputs receive explicit submit validation. */
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const title = String(form.get("title") || "").trim();
      const scope = String(form.get("scope") || "").trim();
      const freelancer = String(form.get("freelancer") || "").trim();
      const arbitrator = String(form.get("arbitrator") || "").trim();
      const zero = "0x0000000000000000000000000000000000000000";
      if (
        ![freelancer, arbitrator].every(
          (a) => isAddress(a) && a.toLowerCase() !== zero,
        ) ||
        new Set([address, freelancer, arbitrator].map((a) => a.toLowerCase()))
          .size !== 3
      )
        throw new Error(
          "Use three different, valid addresses for the client, contributor, and arbitrator.",
        );
      const titles = Array.from({ length: count }, (_, i) =>
        String(form.get(`title-${i}`) || "").trim(),
      );
      const values = amounts.slice(0, count).map((value) => {
        if (!/^\d+(\.\d{1,18})?$/.test(value))
          throw new Error(
            "Use a positive ETH amount with at most 18 decimal places.",
          );
        const amount = parseEther(value);
        if (amount <= 0n)
          throw new Error("Every milestone needs a positive amount.");
        return amount;
      });
      if (!title || !scope || titles.some((value) => !value))
        throw new Error("Add a title, scope, and title for every milestone.");
      if (
        [title, ...titles].some(
          (value) => new TextEncoder().encode(value).length > 120,
        ) ||
        new TextEncoder().encode(scope).length > 1000
      )
        throw new Error(
          "Keep titles under 120 bytes and scope under 1,000 bytes.",
        );
      await onCreate({
        title,
        scope,
        freelancer,
        arbitrator,
        titles,
        amounts: values,
      });
    } catch (e) {
      setError(friendlyError(e));
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
            placeholder="What will be delivered, and what does done look like? You can also reference an ipfs:// agreement."
          />
          <span>
            This record is public. Agree on the scope outside Pact before
            funding.
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
        {Array.from({ length: count }, (_, i) => (
          <div className="milestone-input" key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <label className="sr-only" htmlFor={`milestone-title-${i}`}>
              Milestone {i + 1} title
            </label>
            <input
              id={`milestone-title-${i}`}
              name={`title-${i}`}
              required
              maxLength={120}
              placeholder={
                ["Implementation", "Tests & review", "Documentation"][i]
              }
            />
            <label className="sr-only" htmlFor={`milestone-amount-${i}`}>
              Milestone {i + 1} amount in ETH
            </label>
            <input
              id={`milestone-amount-${i}`}
              className="amount-input"
              inputMode="decimal"
              value={amounts[i]}
              required
              onChange={(event) =>
                setAmounts((current) =>
                  current.map((v, index) =>
                    i === index ? event.target.value : v,
                  ),
                )
              }
            />
            <small>ETH</small>
          </div>
        ))}
      </fieldset>
      <div className="funding-total">
        <div>
          <span>Total to lock</span>
          <small>Plus the network transaction fee</small>
        </div>
        <strong>
          {eth(total)} <small>ETH</small>
        </strong>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <p className="form-note">
        <LockKeyhole size={14} />
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
