// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {PactEscrow} from "./PactEscrow.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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

contract FeeToken is ERC20 {
    constructor() ERC20("Fee Token", "FEE") { _mint(msg.sender, 1_000_000 ether); }
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            super._update(from, address(0xdead), value / 100);
            value -= value / 100;
        }
        super._update(from, to, value);
    }
}
