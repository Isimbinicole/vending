const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VendingMachine", function () {
  let vendingMachine, owner, buyer, other;

  beforeEach(async function () {
    [owner, buyer, other] = await ethers.getSigners();
    const VendingMachine = await ethers.getContractFactory("VendingMachine");
    vendingMachine = await VendingMachine.deploy();
    await vendingMachine.waitForDeployment();
  });

  it("should set the deployer as owner", async function () {
    expect(await vendingMachine.owner()).to.equal(owner.address);
  });

  it("owner can add a product", async function () {
    await vendingMachine.addProduct("Coke", 10, 1);
    const product = await vendingMachine.getProduct(1);
    expect(product[0]).to.equal("Coke");
    expect(product[1]).to.equal(10);
    expect(product[2]).to.equal(1);
  });

  it("non-owner cannot add product", async function () {
    await expect(
      vendingMachine.connect(buyer).addProduct("Pepsi", 5, 1)
    ).to.be.revertedWith("Only owner can perform this action");
  });

  it("owner can restock product", async function () {
    await vendingMachine.addProduct("Water", 5, 1);
    await vendingMachine.restockProduct(1, 10);
    const product = await vendingMachine.getProduct(1);
    expect(product[1]).to.equal(15);
  });

  it("non-owner cannot restock product", async function () {
    await vendingMachine.addProduct("Juice", 5, 1);
    await expect(
      vendingMachine.connect(buyer).restockProduct(1, 10)
    ).to.be.revertedWith("Only owner can perform this action");
  });

  it("buyer can purchase product with exact ETH", async function () {
    await vendingMachine.addProduct("Soda", 3, 1);
    await vendingMachine.connect(buyer).purchaseProduct(1, 1, {
      value: ethers.parseEther("1")
    });
    const product = await vendingMachine.getProduct(1);
    expect(product[1]).to.equal(2);
  });

  it("buyer gets refunded extra ETH", async function () {
    await vendingMachine.addProduct("Soda", 3, 1);

    const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

    const tx = await vendingMachine.connect(buyer).purchaseProduct(1, 1, {
      value: ethers.parseEther("2")
    });
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

    const product = await vendingMachine.getProduct(1);
    expect(product[1]).to.equal(2);

    const expectedSpent = ethers.parseEther("1") + gasUsed;
    expect(buyerBalanceBefore - buyerBalanceAfter).to.be.closeTo(expectedSpent, ethers.parseEther("0.01"));
  });

  it("should revert if insufficient funds sent", async function () {
    await vendingMachine.addProduct("Snack", 5, 1);
    await expect(
      vendingMachine.connect(buyer).purchaseProduct(1, 1, {
        value: ethers.parseEther("0.5")
      })
    ).to.be.revertedWith("Insufficient funds");
  });

  it("should revert if stock is insufficient", async function () {
    await vendingMachine.addProduct("Gum", 1, 1);
    await expect(
      vendingMachine.connect(buyer).purchaseProduct(1, 2, {
        value: ethers.parseEther("2")
      })
    ).to.be.revertedWith("Insufficient stock");
  });

  it("owner can withdraw funds", async function () {
    await vendingMachine.addProduct("Candy", 2, 1);
    await vendingMachine.connect(buyer).purchaseProduct(1, 1, {
      value: ethers.parseEther("1")
    });

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    const tx = await vendingMachine.withdrawFunds();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

    expect(ownerBalanceAfter).to.be.above(ownerBalanceBefore - gasUsed);
  });
});
