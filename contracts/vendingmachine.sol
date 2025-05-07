// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract VendingMachine {
    address public owner;
    mapping(uint => Product) public products;
    uint public productCount;

    struct Product {
        string name;
        uint quantity;
        uint price; // price in ether
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Add new product
    function addProduct(string memory _name, uint _quantity, uint _priceInEther) public onlyOwner {
        productCount++;
        products[productCount] = Product(_name, _quantity, _priceInEther);
    }

    // ✅ Restock existing product
    function restockProduct(uint _productId, uint _additionalQuantity) public onlyOwner {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        products[_productId].quantity += _additionalQuantity;
    }

    // Purchase product
    function purchaseProduct(uint _productId, uint _quantity) public payable {
        Product storage product = products[_productId];
        require(product.quantity >= _quantity, "Insufficient stock");

        uint totalCost = product.price * _quantity * 1 ether;
        require(msg.value >= totalCost, "Insufficient funds");

        product.quantity -= _quantity;

        // Refund extra payment if any
        uint refundAmount = msg.value - totalCost;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
    }

    // Withdraw funds to owner
    function withdrawFunds() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // View product details
    function getProduct(uint _productId) public view returns (string memory, uint, uint) {
        Product memory product = products[_productId];
        return (product.name, product.quantity, product.price);
    }
    }