import "./App.css";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { VENDING_MACHINE_ABI, VENDING_MACHINE_ADDRESS } from "./contractABI";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Container, Nav, Navbar, Card, Button, Form, Table, Alert, Row, Col, Badge } from 'react-bootstrap';

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
  const [notification, setNotification] = useState({ show: false, message: "", variant: "success" });

  useEffect(() => {
    connectWallet();
    loadProductList();
  }, []);

  function showNotification(message, variant = "success") {
    setNotification({ show: true, message, variant });
    setTimeout(() => setNotification({ ...notification, show: false }), 5000);
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        showNotification("Wallet connected successfully!");
      } catch (err) {
        showNotification("Failed to connect wallet", "danger");
      }
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
      showNotification("Failed to load products", "danger");
    }
  }

  async function addProduct() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    try {
      const tx = await contract.addProduct(name, quantity, price);
      await tx.wait();
      showNotification("Product added successfully!");
      setName("");
      setPrice("");
      setQuantity("");
      loadProductList();
    } catch (err) {
      console.error("Add product failed:", err);
      showNotification("Failed to add product", "danger");
    }
  }

  async function restockProduct() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    try {
      const tx = await contract.restockProduct(restockId, restockQuantity);
      await tx.wait();
      showNotification("Product restocked successfully!");
      setRestockId("");
      setRestockQuantity("");
      loadProductList();
    } catch (err) {
      console.error("Restock failed:", err);
      showNotification("Failed to restock product", "danger");
    }
  }

  async function withdrawFunds() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

    try {
      const tx = await contract.withdrawFunds();
      await tx.wait();
      showNotification("Funds withdrawn successfully!");
    } catch (err) {
      console.error("Withdraw failed:", err);
      showNotification("Failed to withdraw funds", "danger");
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
      showNotification("Product purchased successfully!");
      loadProductList();
    } catch (err) {
      console.error("Purchase failed:", err);
      showNotification("Failed to purchase product", "danger");
    }
  }

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#" >
            <i className="bi bi-cup-hot me-2"></i>
            <h1>Vending Machine DApp</h1>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
            
            </Nav>
            <Nav>
              <Navbar.Text>
                {account ? `Connected: ${account}` : "Not Connected"}
              </Navbar.Text>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
      <Nav className="me-auto">
  <Button 
    variant="primary" 
    className="me-3" 
    active={!isSeller} 
    onClick={() => setIsSeller(false)}
  >
    Buyer
  </Button>
  <Button 
    variant="primary" 
    active={isSeller} 
    onClick={() => setIsSeller(true)}
  >
    Seller
  </Button>
</Nav>
        {notification.show && (
          <Alert variant={notification.variant} onClose={() => setNotification({ ...notification, show: false })} dismissible>
            {notification.message}
          </Alert>
        )}

        {isSeller ? (
          <div className="seller-interface">
            <h2 className="mb-4">Seller Dashboard</h2>

            <Row className="mb-5">
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>Add New Product</Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Product Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="Enter product name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Initial Quantity</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="Enter quantity" 
                          value={quantity} 
                          onChange={(e) => setQuantity(e.target.value)} 
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Price (ETH)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter price in ETH" 
                          value={price} 
                          onChange={(e) => setPrice(e.target.value)} 
                        />
                      </Form.Group>
                      <Button variant="primary" onClick={addProduct}>
                        Add Product
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>Restock Product</Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Product ID</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="Enter product ID" 
                          value={restockId} 
                          onChange={(e) => setRestockId(e.target.value)} 
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Additional Quantity</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="Enter quantity to add" 
                          value={restockQuantity} 
                          onChange={(e) => setRestockQuantity(e.target.value)} 
                        />
                      </Form.Group>
                      <Button variant="warning" onClick={restockProduct}>
                        Restock
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header>Withdraw Funds</Card.Header>
                  <Card.Body>
                    <Button variant="success" onClick={withdrawFunds}>
                      Withdraw All Funds
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Card>
              <Card.Header>Current Inventory</Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Price (ETH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter((p) => p.quantity > 0).map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.quantity}</td>
                        <td>{p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        ) : (
          <div className="buyer-interface">
            <h2 className="mb-4">Available Products</h2>
            
            <Row xs={1} md={2} lg={3} className="g-4">
              {products
                .filter((p) => p.quantity > 0)
                .map((product) => (
                  <Col key={product.id}>
                    <Card className="h-100">
                      <Card.Body>
                        <Card.Title>{product.name}</Card.Title>
                        <Card.Text>
                          <Badge bg="info">ID: {product.id}</Badge>
                          <div className="mt-2">
                            <strong>Stock:</strong> {product.quantity}
                          </div>
                          <div>
                            <strong>Price:</strong> {product.price} ETH
                          </div>
                        </Card.Text>
                      </Card.Body>
                      <Card.Footer>
                        <Form.Group className="mb-3">
                          <Form.Label>Quantity</Form.Label>
                          <Form.Control 
                            type="number" 
                            min="1" 
                            max={product.quantity} 
                            value={buyerQuantity} 
                            onChange={(e) => setBuyerQuantity(e.target.value)} 
                          />
                        </Form.Group>
                        <Button 
                          variant="primary" 
                          onClick={() => buyProduct(product.id, product.price)}
                          className="w-100"
                        >
                          Buy Now ({(product.price * buyerQuantity).toFixed(4)} ETH)
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
            </Row>
          </div>
        )}
      </Container>
    </div>
  );
}

export default App;