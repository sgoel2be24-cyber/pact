"use client";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileCheck2,
  Gavel,
} from "lucide-react";
import { eth, statusNames, type Milestone, type Role } from "@/lib/escrow";
import { Reference } from "./primitives";
export type ActionKind =
  | "deliver"
  | "approve"
  | "dispute"
  | "release"
  | "refund";
export default function MilestoneCard({
  item,
  id,
  role,
  busy,
  onAction,
}: {
  item: Milestone;
  id: number;
  role: Role;
  busy: boolean;
  onAction: (kind: ActionKind) => void;
}) {
  const state = statusNames[item.status];
  const descriptions = [
    "Funds are protected. The contributor can submit the agreed work.",
    "Work is ready for the client’s review.",
    "Payment is protected while the arbitrator reviews the evidence.",
    "Payment has reached the contributor.",
    "Payment has returned to the client.",
  ];
  return (
    <article className={`milestone-card ${state.toLowerCase()}`}>
      <div className="milestone-card-top">
        <div
          className={`milestone-number ${item.status >= 3 ? "complete" : ""}`}
        >
          {item.status >= 3 ? (
            <Check size={17} />
          ) : (
            String(id + 1).padStart(2, "0")
          )}
        </div>
        <div className="milestone-title">
          <h4>{item.title}</h4>
          <p>
            {eth(item.amount)} <span>ETH</span>
          </p>
        </div>
        <span className={`status-pill ${state.toLowerCase()}`}>
          <span />
          {state}
        </span>
      </div>
      <p className="milestone-description">{descriptions[item.status]}</p>
      {item.evidenceRef && (
        <div className="evidence-row">
          <FileCheck2 size={15} />
          <Reference value={item.evidenceRef} />
        </div>
      )}
      {item.disputeReason && (
        <div className="dispute-reason">
          <Gavel size={14} />
          <p>{item.disputeReason}</p>
        </div>
      )}
      <div className="milestone-actions">
        {item.status === 0 && role === "Contributor" && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => onAction("deliver")}
          >
            Submit delivery <ArrowRight size={14} />
          </button>
        )}
        {item.status === 1 && role === "Client" && (
          <>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => onAction("dispute")}
            >
              Raise a dispute
            </button>
            <button
              className="primary small-button"
              disabled={busy}
              onClick={() => onAction("approve")}
            >
              Approve & release <ArrowUpRight size={14} />
            </button>
          </>
        )}
        {item.status === 2 && role === "Arbitrator" && (
          <>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => onAction("refund")}
            >
              Refund client <ArrowDownLeft size={14} />
            </button>
            <button
              className="primary small-button"
              disabled={busy}
              onClick={() => onAction("release")}
            >
              Release payment <ArrowUpRight size={14} />
            </button>
          </>
        )}
        {item.status < 3 &&
          ((item.status === 0 && role !== "Contributor") ||
            (item.status === 1 && role !== "Client") ||
            (item.status === 2 && role !== "Arbitrator")) && (
            <span className="waiting">
              <span />
              Waiting for{" "}
              {item.status === 0
                ? "contributor"
                : item.status === 1
                  ? "client review"
                  : "arbitrator decision"}
            </span>
          )}
      </div>
    </article>
  );
}
