// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title JeevanBinduRecords
 * @notice Tamper-evident anchor registry for the JeevanBindu blood donation platform.
 *
 * Only hashes and non-sensitive references are stored. Names, Aadhaar numbers,
 * blood groups, locations and every other piece of personal data stay in MongoDB.
 * The chain provides: an immutable timestamp, a record hash that can be compared
 * with a recomputed off-chain hash, and a transaction trail.
 *
 * Access control:
 *   DEFAULT_ADMIN_ROLE - can grant/revoke WRITER_ROLE (deployer by default)
 *   WRITER_ROLE        - the application backend wallet; the only account that can write
 */
contract JeevanBinduRecords is AccessControl {
    bytes32 public constant WRITER_ROLE = keccak256("WRITER_ROLE");

    enum RecordType {
        REGISTRATION, // 0 - account registered
        VERIFICATION, // 1 - identity verification decision
        MATCH,        // 2 - donor accepted a blood request
        DONATION      // 3 - donation completed
    }

    struct Record {
        bytes32 recordHash;     // SHA-256 of the canonical off-chain record
        bytes32 referenceHash;  // hash of a related reference (e.g. the blood request id)
        RecordType recordType;
        uint64 timestamp;
        address recorder;
        bool exists;
    }

    mapping(bytes32 => Record) private _records;
    uint256 public totalRecords;

    event RecordRegistered(
        bytes32 indexed recordId,
        bytes32 indexed recordHash,
        string recordType,
        uint256 timestamp
    );
    event VerificationRecorded(bytes32 indexed recordId, bytes32 indexed recordHash, bytes32 indexed referenceHash, uint256 timestamp);
    event MatchRecorded(bytes32 indexed recordId, bytes32 indexed recordHash, bytes32 indexed referenceHash, uint256 timestamp);
    event DonationRecorded(bytes32 indexed recordId, bytes32 indexed recordHash, bytes32 indexed referenceHash, uint256 timestamp);

    error InvalidAdmin();
    error EmptyRecordId();
    error EmptyRecordHash();
    error RecordAlreadyExists(bytes32 recordId);
    error RecordNotFound(bytes32 recordId);
    error InvalidRecordType();

    constructor(address admin) {
        if (admin == address(0)) revert InvalidAdmin();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(WRITER_ROLE, admin);
    }

    // ---------------------------------------------------------------- writes

    /// @notice Generic registration. Used for REGISTRATION records and any other RecordType.
    function registerRecord(
        bytes32 recordId,
        bytes32 recordHash,
        bytes32 referenceHash,
        RecordType recordType
    ) external onlyRole(WRITER_ROLE) {
        _store(recordId, recordHash, referenceHash, recordType);
    }

    function recordVerification(bytes32 recordId, bytes32 recordHash, bytes32 referenceHash)
        external
        onlyRole(WRITER_ROLE)
    {
        _store(recordId, recordHash, referenceHash, RecordType.VERIFICATION);
        emit VerificationRecorded(recordId, recordHash, referenceHash, block.timestamp);
    }

    function recordMatch(bytes32 recordId, bytes32 recordHash, bytes32 referenceHash)
        external
        onlyRole(WRITER_ROLE)
    {
        _store(recordId, recordHash, referenceHash, RecordType.MATCH);
        emit MatchRecorded(recordId, recordHash, referenceHash, block.timestamp);
    }

    function recordDonation(bytes32 recordId, bytes32 recordHash, bytes32 referenceHash)
        external
        onlyRole(WRITER_ROLE)
    {
        _store(recordId, recordHash, referenceHash, RecordType.DONATION);
        emit DonationRecorded(recordId, recordHash, referenceHash, block.timestamp);
    }

    // ----------------------------------------------------------------- reads

    function getRecord(bytes32 recordId) external view returns (Record memory) {
        Record memory r = _records[recordId];
        if (!r.exists) revert RecordNotFound(recordId);
        return r;
    }

    function recordExists(bytes32 recordId) external view returns (bool) {
        return _records[recordId].exists;
    }

    /// @notice True when the stored hash for recordId equals the supplied hash.
    function verifyRecord(bytes32 recordId, bytes32 recordHash) external view returns (bool) {
        Record storage r = _records[recordId];
        return r.exists && r.recordHash == recordHash;
    }

    // -------------------------------------------------------------- internal

    function _store(
        bytes32 recordId,
        bytes32 recordHash,
        bytes32 referenceHash,
        RecordType recordType
    ) private {
        if (recordId == bytes32(0)) revert EmptyRecordId();
        if (recordHash == bytes32(0)) revert EmptyRecordHash();
        if (uint8(recordType) > uint8(RecordType.DONATION)) revert InvalidRecordType();
        if (_records[recordId].exists) revert RecordAlreadyExists(recordId);

        _records[recordId] = Record({
            recordHash: recordHash,
            referenceHash: referenceHash,
            recordType: recordType,
            timestamp: uint64(block.timestamp),
            recorder: msg.sender,
            exists: true
        });
        unchecked {
            totalRecords += 1;
        }

        emit RecordRegistered(recordId, recordHash, _typeName(recordType), block.timestamp);
    }

    function _typeName(RecordType t) private pure returns (string memory) {
        if (t == RecordType.REGISTRATION) return "REGISTRATION";
        if (t == RecordType.VERIFICATION) return "VERIFICATION";
        if (t == RecordType.MATCH) return "MATCH";
        return "DONATION";
    }
}
