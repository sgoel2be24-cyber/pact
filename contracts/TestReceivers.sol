// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {PactEscrow} from "./PactEscrow.sol";

// Adversarial fixtures, never deployed with the app.
contract RejectingFreelancer {
    function deliver(PactEscrow escrow, uint256 id) external { escrow.deliver(id, 0, "Rejected transfer fixture"); }
    receive() external payable { revert("No ETH accepted"); }
}
contract ReenteringFreelancer {
    PactEscrow public escrow;
    uint256 public jobId;
    bool public reentrySucceeded;
    function deliver(PactEscrow target, uint256 id) external {
        escrow = target; jobId = id; target.deliver(id, 0, "Reentry fixture");
    }
    receive() external payable {
        (reentrySucceeded,) = address(escrow).call(abi.encodeCall(escrow.approve, (jobId, 0)));
    }
}
