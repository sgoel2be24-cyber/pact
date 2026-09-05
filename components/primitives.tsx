"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { evidenceUrl, explorer, shortAddress } from "@/lib/escrow";
export function Stat({
  label,
  value,
  icon,
  note,
  unit,
  accent = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  note: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? "accent" : ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div>{icon}</div>
      </div>
      <p className="stat-value">
        {value}
        <span>{unit}</span>
      </p>
      <p className="stat-note">
        {accent && <span className="network-dot" />}
        {note}
      </p>
    </div>
  );
}
export function Reference({ value }: { value: string }) {
  const url = evidenceUrl(value);
  return url ? (
    <a className="reference-link" href={url} target="_blank" rel="noreferrer">
      {value}
      <ExternalLink size={13} />
    </a>
  ) : (
    <p className="reference-text">{value}</p>
  );
}
export function TransactionLink({ hash }: { hash: string }) {
  const url = explorer(hash);
  return url ? (
    <a className="transaction-link" href={url} target="_blank" rel="noreferrer">
      View transaction <ExternalLink size={11} />
    </a>
  ) : (
    <span className="transaction-link" title={hash}>
      Tx {shortAddress(hash)}
    </span>
  );
}
export function Person({
  role,
  address,
  current,
  color,
}: {
  role: string;
  address: string;
  current: string;
  color: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="person">
      <div className={`avatar ${color}`}>{role.charAt(0)}</div>
      <div>
        <h4>
          {role}
          {address.toLowerCase() === current.toLowerCase() && <span>You</span>}
        </h4>
        <p title={address}>{shortAddress(address)}</p>
      </div>
      <button
        className="icon-button"
        aria-label={`Copy ${role.toLowerCase()} address`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  busy,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  busy: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">PACT / AGREEMENT</p>
          <h2 id="modal-title">{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
