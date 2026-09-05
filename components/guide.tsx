import {
  ArrowRight,
  CheckCheck,
  FileCheck2,
  Gavel,
  LockKeyhole,
} from "lucide-react";
export default function Guide({ onBack }: { onBack: () => void }) {
  return (
    <div className="guide">
      <p className="eyebrow">LESS GUESSWORK. MORE GOOD WORK.</p>
      <h1>
        One agreement.
        <br />A clear path to paid.
      </h1>
      <p className="guide-intro">
        Pact holds the funds and records the decisions. People review the work.
      </p>
      <div className="guide-flow">
        {[
          {
            icon: <LockKeyhole />,
            title: "Agree & fund",
            text: "Choose your contributor and arbitrator. Define two or three milestones and deposit the exact total.",
          },
          {
            icon: <FileCheck2 />,
            title: "Submit the work",
            text: "The contributor attaches a delivery reference. That milestone is ready for client review.",
          },
          {
            icon: <CheckCheck />,
            title: "Approve & pay",
            text: "The client approves. The contract sends that milestone’s payment directly to the contributor.",
          },
        ].map((step, i) => (
          <div key={step.title}>
            <span className="guide-number">0{i + 1}</span>
            {step.icon}
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        ))}
      </div>
      <div className="guide-dispute">
        <Gavel size={30} />
        <div>
          <h2>A disagreement has a path, too.</h2>
          <p>
            The client records a dispute. The agreed arbitrator reviews the
            delivery and reason, then releases the payment or returns it to the
            client. Other milestones stay protected.
          </p>
          <strong>
            The arbitrator is trusted. The contract enforces their decision—it
            does not judge the quality of the work.
          </strong>
        </div>
      </div>
      <div className="guide-details">
        <div>
          <h3>What is recorded?</h3>
          <p>
            Funding, delivery references, disputes, and payment decisions are
            public on-chain. Use links or IPFS references for deliverables.
            Never include secrets or personal documents.
          </p>
        </div>
        <div>
          <h3>What if someone disappears?</h3>
          <p>
            This hackathon version has no deadlines or automatic cancellation.
            Unresponsive clients or arbitrators can leave funds locked. Use test
            funds and participants who have agreed to take part.
          </p>
        </div>
      </div>
      <button className="primary" onClick={onBack}>
        Back to agreements <ArrowRight size={16} />
      </button>
    </div>
  );
}
