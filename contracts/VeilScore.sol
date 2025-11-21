// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VeilScore
 * @dev Private Reputation Oracle using FHEVM
 *
 * Stores encrypted commitments and boolean access gates per user.
 * Supports two submission patterns:
 * 1. submit() - Simple, no signature verification (trusted relayer)
 * 2. submitWithSig() - Relayer-signed submission (signature verification)
 *
 * For highest privacy, use Pattern A from RELAYER_ARCHITECTURE.md:
 * User decrypts the result locally and signs it before submission.
 */
contract VeilScore {
    struct Entry {
        address owner;
        bytes32 commitment;
        bool allowed;
        uint256 timestamp;
    }

    mapping(address => Entry) public entries;
    address public admin;
    address public relayerAddress;  // Address authorized to submit signed evaluations

    event EntrySubmitted(
        address indexed owner,
        bytes32 commitment,
        bool allowed,
        uint256 timestamp
    );
    event RelayerAddressUpdated(address indexed newRelayer, address indexed updatedBy);

    constructor() {
        admin = msg.sender;
        relayerAddress = msg.sender;  // Initially admin is also relayer
    }

    /**
     * @dev Simple submission (Pattern 2: Relayer-Signed, no verification)
     * Use when relayer is trusted and full automation is required.
     * WARNING: Relies on relayer to compute correctly; any plaintext result visible on-chain.
     */
    function submit(bytes32 commitment, bool allowed) external {
        entries[msg.sender] = Entry(msg.sender, commitment, allowed, block.timestamp);
        emit EntrySubmitted(msg.sender, commitment, allowed, block.timestamp);
    }

    /**
     * @dev Signature-verified submission (Model 2: Relayer-Signed with verification)
     * Relayer computes inside FHEVM, signs plaintext result, client submits.
     * Contract verifies relayer signature before storing.
     *
     * NOTE: For highest privacy, upgrade to Model 1 (encrypted result):
     * - User decrypts result locally
     * - User signs commitment + plaintext locally
     * - Contract verifies user signature (not relayer)
     * See RELAYER_ARCHITECTURE.md for details.
     *
     * @param commitment Encrypted signal commitment (from client)
     * @param allowed Boolean gate result from relayer
     * @param relayerSignature Relayer's signature over (msg.sender, commitment, allowed)
     */
    function submitWithSig(
        bytes32 commitment,
        bool allowed,
        bytes calldata relayerSignature
    ) external {
        // Reconstruct message hash as relayer would have signed
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, commitment, allowed)
        );

        // Recover signer from signature
        address recoveredSigner = recoverSigner(messageHash, relayerSignature);

        // Verify signature is from authorized relayer
        require(
            recoveredSigner == relayerAddress,
            "VeilScore: Invalid relayer signature"
        );

        // Store entry
        entries[msg.sender] = Entry(msg.sender, commitment, allowed, block.timestamp);
        emit EntrySubmitted(msg.sender, commitment, allowed, block.timestamp);
    }

    /**
     * @dev Recover signer from message hash and signature
     * Assumes standard ECDSA signature format (v, r, s)
     */
    function recoverSigner(
        bytes32 messageHash,
        bytes calldata signature
    ) internal pure returns (address) {
        require(signature.length == 65, "VeilScore: Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // First 32 bytes after length offset are the r value
            r := calldataload(add(signature.offset, 0))
            // Next 32 bytes are the s value
            s := calldataload(add(signature.offset, 32))
            // Final byte is the recovery id (v)
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        // Add Ethereum message prefix for proper signature verification
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );

        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        require(signer != address(0), "VeilScore: Invalid signature");

        return signer;
    }

    /**
     * @dev Admin-only: Set the relayer address (for Pattern 2 signature verification)
     * Call this after relayer key rotation or to use a different relayer instance.
     */
    function setRelayerAddress(address newRelayer) external {
        require(msg.sender == admin, "VeilScore: Only admin can update relayer");
        require(newRelayer != address(0), "VeilScore: Invalid relayer address");
        relayerAddress = newRelayer;
        emit RelayerAddressUpdated(newRelayer, msg.sender);
    }

    /**
     * @dev Query user's stored entry (commitment, gate, timestamp)
     */
    function getEntry(address user)
        external
        view
        returns (
            bytes32,
            bool,
            uint256
        )
    {
        Entry memory e = entries[user];
        return (e.commitment, e.allowed, e.timestamp);
    }

    /**
     * @dev Check if user has an entry stored
     */
    function hasEntry(address user) external view returns (bool) {
        return entries[user].owner != address(0);
    }
}
