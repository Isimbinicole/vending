# Sample Hardhat Project

Introduction 

A decentralized vending machine application built on Ethereum. This DApp allows sellers to manage product inventory and buyers to purchase items directly using Ether (ETH) by using MetaMask.

User of the system and there role 

1.Seller 
Connect wallet using MetaMask.
Add new products (name, price, quantity).
view all available products.
restock existing products.
Withdraw earnings collected from buyers

2.Buyer
Connect wallet using MetaMask
Purchase products using ETH
Browse available products

Technology used

Solidity – Smart contract development
Hardhat – Ethereum development environment
React.js – Frontend interface
Ethers.js – Ethereum interaction
Bootstrap – Responsive UI styling
MetaMask – Wallet connection
 
Basics
Node.js & npm
MetaMask extension installed
Hardhat installed globally:npm install --save-dev hardhat

Support
clone repository
git clone https://github.com/Isimbinicole/vending.git

run the following task after cloning 

cd vending
1.Compile & Deploy Smart Contract
cd ..
npx hardhat compile
npx hardhat test
npx hardhat node 


2.open new terminal
npx hardhat run scripts/deploy.js --network localhost


3.Start frontend in new terminal
cd frontend
npm start





