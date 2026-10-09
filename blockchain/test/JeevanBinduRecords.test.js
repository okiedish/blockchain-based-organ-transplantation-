const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const id = (s) => ethers.sha256(ethers.toUtf8Bytes("id:" + s));
const hash = (s) => ethers.sha256(ethers.toUtf8Bytes("hash:" + s));
const ZERO = ethers.ZeroHash;
const Type = { REGISTRATION: 0, VERIFICATION: 1, MATCH: 2, DONATION: 3 };

describe("JeevanBinduRecords", () => {
  async function deploy() {
    const [admin, writer, stranger] = await ethers.getSigners();
    const contract = await (await ethers.getContractFactory("JeevanBinduRecords")).deploy(admin.address);
    await contract.waitForDeployment();
    await contract.grantRole(await contract.WRITER_ROLE(), writer.address);
    return { contract, admin, writer, stranger };
  }

  describe("deployment", () => {
    it("deploys with the admin holding both roles and zero records", async () => {
      const { contract, admin } = await loadFixture(deploy);
      expect(await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
      expect(await contract.hasRole(await contract.WRITER_ROLE(), admin.address)).to.equal(true);
      expect(await contract.totalRecords()).to.equal(0n);
    });

    it("rejects the zero address as admin", async () => {
      const F = await ethers.getContractFactory("JeevanBinduRecords");
      await expect(F.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(F, "InvalidAdmin");
    });
  });

  describe("registerRecord", () => {
    it("lets a writer store a record and emits RecordRegistered", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await expect(contract.connect(writer).registerRecord(id("u1"), hash("u1"), id("ref"), Type.REGISTRATION))
        .to.emit(contract, "RecordRegistered")
        .withArgs(id("u1"), hash("u1"), "REGISTRATION", (ts) => ts > 0n);
      expect(await contract.totalRecords()).to.equal(1n);
      expect(await contract.recordExists(id("u1"))).to.equal(true);
    });

    it("prevents duplicate record ids", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await contract.connect(writer).registerRecord(id("u1"), hash("u1"), ZERO, Type.REGISTRATION);
      await expect(contract.connect(writer).registerRecord(id("u1"), hash("other"), ZERO, Type.REGISTRATION))
        .to.be.revertedWithCustomError(contract, "RecordAlreadyExists")
        .withArgs(id("u1"));
      expect(await contract.totalRecords()).to.equal(1n);
    });

    it("rejects an empty record id", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await expect(contract.connect(writer).registerRecord(ZERO, hash("x"), ZERO, Type.REGISTRATION))
        .to.be.revertedWithCustomError(contract, "EmptyRecordId");
    });

    it("rejects an empty record hash", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await expect(contract.connect(writer).registerRecord(id("x"), ZERO, ZERO, Type.REGISTRATION))
        .to.be.revertedWithCustomError(contract, "EmptyRecordHash");
    });

    it("rejects an out-of-range record type", async () => {
      const { contract, writer } = await loadFixture(deploy);
      // The ABI decoder reverts for enum values outside the declared range.
      await expect(contract.connect(writer).registerRecord(id("x"), hash("x"), ZERO, 9)).to.be.reverted;
    });
  });

  describe("authorization", () => {
    it("blocks accounts without WRITER_ROLE from every write function", async () => {
      const { contract, stranger } = await loadFixture(deploy);
      const c = contract.connect(stranger);
      await expect(c.registerRecord(id("a"), hash("a"), ZERO, Type.REGISTRATION)).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
      await expect(c.recordVerification(id("a"), hash("a"), ZERO)).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
      await expect(c.recordMatch(id("a"), hash("a"), ZERO)).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
      await expect(c.recordDonation(id("a"), hash("a"), ZERO)).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
      expect(await contract.totalRecords()).to.equal(0n);
    });

    it("only the admin can grant and revoke WRITER_ROLE", async () => {
      const { contract, writer, stranger } = await loadFixture(deploy);
      const role = await contract.WRITER_ROLE();
      await expect(contract.connect(stranger).grantRole(role, stranger.address)).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
      await contract.revokeRole(role, writer.address);
      await expect(contract.connect(writer).recordDonation(id("d"), hash("d"), ZERO)).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });
  });

  describe("typed records", () => {
    it("records a verification and emits VerificationRecorded + RecordRegistered", async () => {
      const { contract, writer } = await loadFixture(deploy);
      const tx = contract.connect(writer).recordVerification(id("v1"), hash("v1"), id("user1"));
      await expect(tx).to.emit(contract, "VerificationRecorded").withArgs(id("v1"), hash("v1"), id("user1"), (ts) => ts > 0n);
      await expect(tx).to.emit(contract, "RecordRegistered").withArgs(id("v1"), hash("v1"), "VERIFICATION", (ts) => ts > 0n);
      expect((await contract.getRecord(id("v1"))).recordType).to.equal(BigInt(Type.VERIFICATION));
    });

    it("records a match and emits MatchRecorded", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await expect(contract.connect(writer).recordMatch(id("m1"), hash("m1"), id("req1")))
        .to.emit(contract, "MatchRecorded")
        .withArgs(id("m1"), hash("m1"), id("req1"), (ts) => ts > 0n);
      expect((await contract.getRecord(id("m1"))).recordType).to.equal(BigInt(Type.MATCH));
    });

    it("records a donation and emits DonationRecorded", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await expect(contract.connect(writer).recordDonation(id("d1"), hash("d1"), id("req1")))
        .to.emit(contract, "DonationRecorded")
        .withArgs(id("d1"), hash("d1"), id("req1"), (ts) => ts > 0n);
      expect((await contract.getRecord(id("d1"))).recordType).to.equal(BigInt(Type.DONATION));
    });

    it("typed functions share duplicate protection", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await contract.connect(writer).recordDonation(id("d1"), hash("d1"), ZERO);
      await expect(contract.connect(writer).recordMatch(id("d1"), hash("d1"), ZERO)).to.be.revertedWithCustomError(contract, "RecordAlreadyExists");
    });

    it("typed functions validate empty inputs", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await expect(contract.connect(writer).recordDonation(ZERO, hash("d"), ZERO)).to.be.revertedWithCustomError(contract, "EmptyRecordId");
      await expect(contract.connect(writer).recordMatch(id("m"), ZERO, ZERO)).to.be.revertedWithCustomError(contract, "EmptyRecordHash");
    });
  });

  describe("retrieval", () => {
    it("returns the stored record with recorder and timestamp", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await contract.connect(writer).recordDonation(id("d1"), hash("d1"), id("req1"));
      const r = await contract.getRecord(id("d1"));
      expect(r.recordHash).to.equal(hash("d1"));
      expect(r.referenceHash).to.equal(id("req1"));
      expect(r.recorder).to.equal(writer.address);
      expect(r.timestamp).to.be.gt(0n);
      expect(r.exists).to.equal(true);
    });

    it("reverts for unknown records", async () => {
      const { contract } = await loadFixture(deploy);
      await expect(contract.getRecord(id("nope"))).to.be.revertedWithCustomError(contract, "RecordNotFound");
      expect(await contract.recordExists(id("nope"))).to.equal(false);
    });

    it("verifyRecord detects tampered hashes", async () => {
      const { contract, writer } = await loadFixture(deploy);
      await contract.connect(writer).recordDonation(id("d1"), hash("d1"), ZERO);
      expect(await contract.verifyRecord(id("d1"), hash("d1"))).to.equal(true);
      expect(await contract.verifyRecord(id("d1"), hash("tampered"))).to.equal(false);
      expect(await contract.verifyRecord(id("unknown"), hash("d1"))).to.equal(false);
    });
  });
});
