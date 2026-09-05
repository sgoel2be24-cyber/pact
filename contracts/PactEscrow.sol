// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PactEscrow — independently settled milestones with a named arbitrator.
/// @notice Testnet prototype. Arbitration is trusted; evidence does not prove quality.
contract PactEscrow is ReentrancyGuard {
    enum Status { Funded, Delivered, Disputed, Released, Refunded }

    struct Job {
        address client;
        address freelancer;
        address arbitrator;
        string title;
        string agreementRef;
        uint256 total;
        uint256 released;
        uint256 refunded;
        uint256 createdAt;
    }
    struct Milestone {
        string title;
        uint256 amount;
        Status status;
        string evidenceRef;
        string disputeReason;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) private jobs;
    mapping(uint256 => Milestone[]) private milestones;

    error InvalidJob();
    error InvalidMilestone();
    error InvalidParticipants();
    error InvalidMilestoneCount();
    error InvalidAmount();
    error IncorrectFunding();
    error InvalidText();
    error Unauthorized();
    error InvalidState();
    error PaymentFailed();

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, address arbitrator, string title, uint256 total);
    event MilestoneDelivered(uint256 indexed jobId, uint256 indexed milestoneId, string evidenceRef);
    event MilestoneDisputed(uint256 indexed jobId, uint256 indexed milestoneId, string reason);
    event MilestoneSettled(uint256 indexed jobId, uint256 indexed milestoneId, address indexed recipient, uint256 amount, Status status, string decision);

    /// @dev Participants must agree on scope and arbitrator before funding.
    function createJob(
        address freelancer,
        address arbitrator,
        string calldata title,
        string calldata agreementRef,
        string[] calldata titles,
        uint256[] calldata amounts
    ) external payable nonReentrant returns (uint256 jobId) {
        if (freelancer == address(0) || arbitrator == address(0) || freelancer == msg.sender || arbitrator == msg.sender || arbitrator == freelancer) revert InvalidParticipants();
        if (titles.length < 2 || titles.length > 3 || titles.length != amounts.length) revert InvalidMilestoneCount();
        _validateText(title, 120);
        _validateText(agreementRef, 1000);
        uint256 total;
        for (uint256 i; i < amounts.length; ++i) {
            _validateText(titles[i], 120);
            if (amounts[i] == 0) revert InvalidAmount();
            total += amounts[i];
        }
        if (msg.value != total) revert IncorrectFunding();
        jobId = jobCount++;
        jobs[jobId] = Job(msg.sender, freelancer, arbitrator, title, agreementRef, total, 0, 0, block.timestamp);
        for (uint256 i; i < amounts.length; ++i) {
            milestones[jobId].push(Milestone(titles[i], amounts[i], Status.Funded, "", ""));
        }
        emit JobCreated(jobId, msg.sender, freelancer, arbitrator, title, total);
    }

    function deliver(uint256 jobId, uint256 milestoneId, string calldata evidenceRef) external {
        Job storage job = _job(jobId);
        if (msg.sender != job.freelancer) revert Unauthorized();
        Milestone storage item = _milestone(jobId, milestoneId);
        if (item.status != Status.Funded) revert InvalidState();
        _validateText(evidenceRef, 1000);
        item.evidenceRef = evidenceRef;
        item.status = Status.Delivered;
        emit MilestoneDelivered(jobId, milestoneId, evidenceRef);
    }

    function approve(uint256 jobId, uint256 milestoneId) external nonReentrant {
        Job storage job = _job(jobId);
        if (msg.sender != job.client) revert Unauthorized();
        Milestone storage item = _milestone(jobId, milestoneId);
        if (item.status != Status.Delivered) revert InvalidState();
        _settle(jobId, milestoneId, job, item, true, "Client approved delivery");
    }

    function dispute(uint256 jobId, uint256 milestoneId, string calldata reason) external {
        Job storage job = _job(jobId);
        if (msg.sender != job.client) revert Unauthorized();
        Milestone storage item = _milestone(jobId, milestoneId);
        if (item.status != Status.Delivered) revert InvalidState();
        _validateText(reason, 1000);
        item.disputeReason = reason;
        item.status = Status.Disputed;
        emit MilestoneDisputed(jobId, milestoneId, reason);
    }

    function resolve(uint256 jobId, uint256 milestoneId, bool releaseToFreelancer, string calldata decision) external nonReentrant {
        Job storage job = _job(jobId);
        if (msg.sender != job.arbitrator) revert Unauthorized();
        Milestone storage item = _milestone(jobId, milestoneId);
        if (item.status != Status.Disputed) revert InvalidState();
        _validateText(decision, 1000);
        _settle(jobId, milestoneId, job, item, releaseToFreelancer, decision);
    }

    function getJob(uint256 jobId) external view returns (Job memory) { return _job(jobId); }
    function getMilestones(uint256 jobId) external view returns (Milestone[] memory) {
        _job(jobId);
        return milestones[jobId];
    }

    /// @dev Checks and accounting precede external interaction. A failed transfer
    /// reverts the entire settlement, so another milestone's funds stay protected.
    function _settle(uint256 jobId, uint256 milestoneId, Job storage job, Milestone storage item, bool release, string memory decision) private {
        address recipient;
        if (release) {
            item.status = Status.Released;
            job.released += item.amount;
            recipient = job.freelancer;
        } else {
            item.status = Status.Refunded;
            job.refunded += item.amount;
            recipient = job.client;
        }
        emit MilestoneSettled(jobId, milestoneId, recipient, item.amount, item.status, decision);
        (bool sent,) = payable(recipient).call{value: item.amount}("");
        if (!sent) revert PaymentFailed();
    }

    function _job(uint256 id) private view returns (Job storage) {
        if (id >= jobCount) revert InvalidJob();
        return jobs[id];
    }
    function _milestone(uint256 jobId, uint256 id) private view returns (Milestone storage) {
        if (id >= milestones[jobId].length) revert InvalidMilestone();
        return milestones[jobId][id];
    }
    function _validateText(string calldata value, uint256 maxLength) private pure {
        if (bytes(value).length == 0 || bytes(value).length > maxLength) revert InvalidText();
    }
}
