import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ContractFactory, JsonRpcProvider, parseEther } from "ethers";
const provider = new JsonRpcProvider(process.env.TEST_RPC_URL, undefined, {
  cacheTimeout: -1,
  pollingInterval: 50,
});
const artifact = (name) =>
  JSON.parse(fs.readFileSync(`artifacts/${name}.json`, "utf8"));
const [client, freelancer, arbitrator, outsider] = await Promise.all(
  [0, 1, 2, 3].map((i) => provider.getSigner(i)),
);
const [clientAddress, freelancerAddress, arbitratorAddress] = await Promise.all(
  [client, freelancer, arbitrator].map((s) => s.getAddress()),
);
const amounts = [parseEther("0.012"), parseEther("0.008"), parseEther("0.005")];
const total = amounts.reduce((a, b) => a + b, 0n);
async function deploy(name, signer = client) {
  const a = artifact(name);
  const c = await new ContractFactory(a.abi, a.bytecode, signer).deploy();
  await c.waitForDeployment();
  return c;
}
async function fixture(freelancerOverride) {
  const contract = await deploy("PactEscrow");
  await (
    await contract.createJob(
      freelancerOverride ?? freelancerAddress,
      arbitratorAddress,
      "SDK integration",
      "Scope agreed by all parties",
      ["API", "Tests", "Docs"],
      amounts,
      { value: total },
    )
  ).wait();
  return contract;
}
async function expectError(call, name, contract) {
  await assert.rejects(call, (error) => {
    const data =
      error.data ?? error.info?.error?.data?.data ?? error.info?.error?.data;
    let parsed;
    try {
      parsed = contract.interface.parseError(data);
    } catch {}
    assert.equal(
      error.revert?.name ?? parsed?.name,
      name,
      `Expected ${name}: ${error.shortMessage ?? error.message}`,
    );
    return true;
  });
}
const balance = (address) => provider.getBalance(address, "latest");
after(() => provider.destroy());

test("funding stores exact allocation, distinct participants, and immutable scope", async () => {
  const c = await fixture();
  const job = await c.getJob(0);
  const items = await c.getMilestones(0);
  assert.equal(job.client, clientAddress);
  assert.equal(job.freelancer, freelancerAddress);
  assert.equal(job.arbitrator, arbitratorAddress);
  assert.equal(job.total, total);
  assert.equal(await balance(await c.getAddress()), total);
  assert.deepEqual(
    items.map((i) => i.amount),
    amounts,
  );
  assert.ok(items.every((i) => i.status === 0n));
});
test("rejects wrong funding, zero amount, invalid milestone count, and missing scope", async () => {
  const c = await deploy("PactEscrow");
  const create = (titles, values, value, scope = "Scope") =>
    c.createJob.staticCall(
      freelancerAddress,
      arbitratorAddress,
      "Job",
      scope,
      titles,
      values,
      { value },
    );
  await expectError(create(["A", "B"], [1n, 2n], 2n), "IncorrectFunding", c);
  await expectError(create(["A", "B"], [1n, 2n], 4n), "IncorrectFunding", c);
  await expectError(create(["A", "B"], [0n, 2n], 2n), "InvalidAmount", c);
  await expectError(create(["A"], [1n], 1n), "InvalidMilestoneCount", c);
  await expectError(
    create(["A", "B", "C", "D"], [1n, 1n, 1n, 1n], 4n),
    "InvalidMilestoneCount",
    c,
  );
  await expectError(create(["A", "B"], [1n], 1n), "InvalidMilestoneCount", c);
  await expectError(create(["A", "B"], [1n, 2n], 3n, ""), "InvalidText", c);
  assert.equal(await c.jobCount(), 0n);
});
test("rejects zero and overlapping participant roles", async () => {
  const c = await deploy("PactEscrow");
  for (const [f, a] of [
    [clientAddress, arbitratorAddress],
    [freelancerAddress, clientAddress],
    [freelancerAddress, freelancerAddress],
    ["0x0000000000000000000000000000000000000000", arbitratorAddress],
  ]) {
    await expectError(
      c.createJob.staticCall(f, a, "Job", "Scope", ["A", "B"], [1n, 1n], {
        value: 2n,
      }),
      "InvalidParticipants",
      c,
    );
  }
});
test("only freelancer delivers, only client approves/disputes, only arbitrator resolves", async () => {
  const c = await fixture();
  for (const signer of [client, arbitrator, outsider])
    await expectError(
      c.connect(signer).deliver.staticCall(0, 0, "Proof"),
      "Unauthorized",
      c,
    );
  await (
    await c.connect(freelancer).deliver(0, 0, "https://example.com/commit")
  ).wait();
  for (const signer of [freelancer, arbitrator, outsider]) {
    await expectError(
      c.connect(signer).approve.staticCall(0, 0),
      "Unauthorized",
      c,
    );
    await expectError(
      c.connect(signer).dispute.staticCall(0, 0, "Missing test"),
      "Unauthorized",
      c,
    );
  }
  await (await c.dispute(0, 0, "Missing test")).wait();
  for (const signer of [client, freelancer, outsider])
    await expectError(
      c.connect(signer).resolve.staticCall(0, 0, true, "Accepted"),
      "Unauthorized",
      c,
    );
});
test("approval transfers exactly one allocation; other milestones remain locked", async () => {
  const c = await fixture();
  const before = await balance(freelancerAddress);
  await (await c.connect(freelancer).deliver(0, 0, "Proof")).wait();
  const afterDelivery = await balance(freelancerAddress);
  assert.ok(afterDelivery < before);
  await (await c.approve(0, 0)).wait();
  assert.equal(await balance(freelancerAddress), afterDelivery + amounts[0]);
  assert.equal(await balance(await c.getAddress()), total - amounts[0]);
  assert.equal((await c.getJob(0)).released, amounts[0]);
  assert.deepEqual(
    (await c.getMilestones(0)).map((i) => i.status),
    [3n, 0n, 0n],
  );
});
test("arbitrator refund returns exact amount to client and preserves evidence and decision event", async () => {
  const c = await fixture();
  await (
    await c.connect(freelancer).deliver(0, 1, "https://example.com/tests")
  ).wait();
  await (await c.dispute(0, 1, "Acceptance tests are missing")).wait();
  const before = await balance(clientAddress);
  const receipt = await (
    await c
      .connect(arbitrator)
      .resolve(0, 1, false, "Missing tests confirmed; refund client")
  ).wait();
  assert.equal(await balance(clientAddress), before + amounts[1]);
  const job = await c.getJob(0);
  assert.equal(job.refunded, amounts[1]);
  assert.equal(job.released, 0n);
  const item = (await c.getMilestones(0))[1];
  assert.equal(item.status, 4n);
  assert.equal(item.evidenceRef, "https://example.com/tests");
  assert.equal(item.disputeReason, "Acceptance tests are missing");
  const event = receipt.logs
    .map((l) => {
      try {
        return c.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e?.name === "MilestoneSettled");
  assert.equal(event.args.decision, "Missing tests confirmed; refund client");
});
test("arbitrator can release disputed funds to freelancer", async () => {
  const c = await fixture();
  await (await c.connect(freelancer).deliver(0, 2, "Proof")).wait();
  await (await c.dispute(0, 2, "Review requested")).wait();
  const before = await balance(freelancerAddress);
  await (
    await c
      .connect(arbitrator)
      .resolve(0, 2, true, "Deliverable meets agreement")
  ).wait();
  assert.equal(await balance(freelancerAddress), before + amounts[2]);
  assert.equal((await c.getMilestones(0))[2].status, 3n);
});
test("invalid transitions and double settlements cannot move funds", async () => {
  const c = await fixture();
  await expectError(c.approve.staticCall(0, 0), "InvalidState", c);
  await expectError(c.dispute.staticCall(0, 0, "Reason"), "InvalidState", c);
  await expectError(
    c.connect(arbitrator).resolve.staticCall(0, 0, true, "Decision"),
    "InvalidState",
    c,
  );
  await (await c.connect(freelancer).deliver(0, 0, "Proof")).wait();
  await expectError(
    c.connect(freelancer).deliver.staticCall(0, 0, "Overwrite"),
    "InvalidState",
    c,
  );
  await (await c.approve(0, 0)).wait();
  await expectError(c.approve.staticCall(0, 0), "InvalidState", c);
  await expectError(c.dispute.staticCall(0, 0, "Reason"), "InvalidState", c);
  await (await c.connect(freelancer).deliver(0, 1, "Proof")).wait();
  await (await c.dispute(0, 1, "Reason")).wait();
  await expectError(c.approve.staticCall(0, 1), "InvalidState", c);
  await (await c.connect(arbitrator).resolve(0, 1, false, "Refund")).wait();
  await expectError(
    c.connect(arbitrator).resolve.staticCall(0, 1, true, "Pay again"),
    "InvalidState",
    c,
  );
  assert.equal(await balance(await c.getAddress()), amounts[2]);
});
test("invalid IDs and empty or oversized evidence fail explicitly", async () => {
  const c = await fixture();
  await expectError(c.getJob(1), "InvalidJob", c);
  await expectError(
    c.connect(freelancer).deliver.staticCall(0, 3, "Proof"),
    "InvalidMilestone",
    c,
  );
  await expectError(
    c.connect(freelancer).deliver.staticCall(0, 0, ""),
    "InvalidText",
    c,
  );
  await expectError(
    c.connect(freelancer).deliver.staticCall(0, 0, "a".repeat(1001)),
    "InvalidText",
    c,
  );
});
test("rejecting recipient rolls back settlement and all accounting", async () => {
  const receiver = await deploy("RejectingFreelancer");
  const c = await fixture(await receiver.getAddress());
  await (await receiver.deliver(await c.getAddress(), 0)).wait();
  await expectError(c.approve.staticCall(0, 0), "PaymentFailed", c);
  await assert.rejects(async () => {
    const tx = await c.approve(0, 0, { gasLimit: 300000 });
    await tx.wait();
  });
  assert.equal((await c.getMilestones(0))[0].status, 1n);
  assert.equal((await c.getJob(0)).released, 0n);
  assert.equal(await balance(await c.getAddress()), total);
});
test("recipient reentry cannot trigger an additional release", async () => {
  const receiver = await deploy("ReenteringFreelancer");
  const c = await fixture(await receiver.getAddress());
  await (await receiver.deliver(await c.getAddress(), 0)).wait();
  await (await c.approve(0, 0)).wait();
  assert.equal(await receiver.reentrySucceeded(), false);
  assert.equal(await balance(await receiver.getAddress()), amounts[0]);
  assert.equal(await balance(await c.getAddress()), total - amounts[0]);
});
test("multiple jobs remain isolated and final settlement conserves all deposits", async () => {
  const c = await fixture();
  await (
    await c.createJob(
      freelancerAddress,
      arbitratorAddress,
      "Second job",
      "Scope",
      ["A", "B"],
      [1n, 2n],
      { value: 3n },
    )
  ).wait();
  for (let i = 0; i < 3; i++) {
    await (await c.connect(freelancer).deliver(0, i, "Proof")).wait();
    await (await c.approve(0, i)).wait();
  }
  assert.equal(await balance(await c.getAddress()), 3n);
  assert.equal((await c.getJob(0)).released, total);
  assert.equal((await c.getJob(1)).released, 0n);
  assert.ok((await c.getMilestones(1)).every((i) => i.status === 0n));
});
