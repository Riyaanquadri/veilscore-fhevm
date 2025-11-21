// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VeilScore {
    struct Entry {
        address owner;
        bytes32 commitment;
        bool allowed;
        uint256 timestamp;
    }

    mapping(address => Entry) public entries;
    address public admin;

    event EntrySubmitted(address indexed owner, bytes32 commitment, bool allowed, uint256 timestamp);

    constructor() {
        admin = msg.sender;
    }

    function submit(bytes32 commitment, bool allowed) external {
        entries[msg.sender] = Entry(msg.sender, commitment, allowed, block.timestamp);
        emit EntrySubmitted(msg.sender, commitment, allowed, block.timestamp);
    }

    function getEntry(address user) external view returns (bytes32, bool, uint256) {
        Entry memory e = entries[user];
        return (e.commitment, e.allowed, e.timestamp);
    }
}
