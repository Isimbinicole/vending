import "./App.css";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { VENDING_MACHINE_ABI, VENDING_MACHINE_ADDRESS } from "./contractABI";

function App() {
  const [account, setAccount] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [restockId, setRestockId] = useState("");
  const [restockQuantity, setRestockQuantity] = useState("");
  const [buyerQuantity, setBuyerQuantity] = useState(1);

  useEffect(() => {
    connectWallet();
    loadProductList();
  }, []);

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    }
  }

  async function loadProductList() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, provider);

    try {
      let results = [];
      for (let i = 1; i <= 10; i++) {
        const product = await contract.getProduct(i);
        if (product[0]) {
          results.push({
            id: i,
            name: product[0],
            quantity: Number(product[1]),
            price: product[2].toString()
          });
        }
      }
      setProducts(results);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }

  async function addProduct() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    try {
      const tx = await contract.addProduct(name, quantity, price);
      await tx.wait();
      alert("Product added successfully!");
      setName("");
      setPrice("");
      setQuantity("");
      loadProductList();
    } catch (err) {
      console.error("Add product failed:", err);
    }
  }

  async function restockProduct() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    try {
      const tx = await contract.restockProduct(restockId, restockQuantity);
      await tx.wait();
      alert("Product restocked!");
      setRestockId("");
      setRestockQuantity("");
      loadProductList();
    } catch (err) {
      console.error("Restock failed:", err);
    }
  }

  async function withdrawFunds() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    try {
      const tx = await contract.withdrawFunds();
      await tx.wait();
      alert("Funds withdrawn!");
    } catch (err) {
      console.error("Withdraw failed:", err);
    }
  }

  async function buyProduct(id, price) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    const totalCost = ethers.parseEther((price * buyerQuantity).toString());

    try {
      const tx = await contract.purchaseProduct(id, buyerQuantity, { value: totalCost });
      await tx.wait();
      alert("Product purchased!");
      loadProductList();
    } catch (err) {
      console.error("Purchase failed:", err);
    }
  }

  return (
    <div className="App">
      <h2>Vending Machine DApp</h2>
      <p>Connected Wallet: {account}</p>

      <div className="role-select">
        <button onClick={() => setIsSeller(true)}>Seller</button>
      </div>

      {isSeller ? (
        <div className="seller-interface">
          <h3>Seller Dashboard</h3>

          <div className="form-section">
            <h4>Add Product</h4>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <input placeholder="Price (ETH)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <button onClick={addProduct}>Add Product</button>
          </div>

          <div className="form-section">
            <h4>Restock Product</h4>
            <input placeholder="Product ID" value={restockId} onChange={(e) => setRestockId(e.target.value)} />
            <input placeholder="Additional Quantity" value={restockQuantity} onChange={(e) => setRestockQuantity(e.target.value)} />
            <button onClick={restockProduct}>Restock</button>
          </div>

          <div className="form-section">
            <h4>Withdraw Funds</h4>
            <button onClick={withdrawFunds}>Withdraw</button>
          </div>

          <div className="form-section">
            <h4>Products in Stock</h4>
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price (ETH)</th>
                </tr>
              </thead>
              <tbody>
                {products.filter((p) => p.quantity > 0).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => setIsSeller(false)}>Back</button>
        </div>
      ) : (
        <div className="buyer-interface">
          <h3>Buyer Dashboard</h3>
          {products
            .filter((p) => p.quantity > 0)
            .map((product) => (
              <div key={product.id} className="product">
                <h4>{product.name}</h4>
                <p>Stock: {product.quantity}</p>
                <p>Price: {product.price} ETH</p>
                <input
                  type="number"
                  min="1"
                  value={buyerQuantity}
                  onChange={(e) => setBuyerQuantity(e.target.value)}
                />
                <button onClick={() => buyProduct(product.id, product.price)}>Buy</button>
              </div>
            ))}

          <button onClick={() => setIsSeller(false)}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;
