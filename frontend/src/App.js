import "./App.css";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { VENDING_MACHINE_ABI, VENDING_MACHINE_ADDRESS } from "./contractABI";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Container, Nav, Navbar, Card, Button, Form, Table, Alert, Row, Col, Badge, InputGroup, Offcanvas } from 'react-bootstrap';

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

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
      setActiveTab("inventory");
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
      setActiveTab("inventory");
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
        <Container fluid>
          <Button 
            variant="dark" 
            onClick={() => setShowSidebar(true)} 
            className="me-2 d-lg-none"
          >
            <i className="bi bi-list"></i>
          </Button>
          <Navbar.Brand href="#">
            <i className="bi bi-cup-hot me-2"></i>
            Vending Machine DApp
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Button 
                variant={!isSeller ? "primary" : "outline-primary"} 
                className="me-2" 
                onClick={() => setIsSeller(false)}
              >
                <i className="bi bi-cart me-1"></i> Buyer
              </Button>
              <Button 
                variant={isSeller ? "primary" : "outline-primary"} 
                onClick={() => setIsSeller(true)}
              >
                <i className="bi bi-shop me-1"></i> Seller
              </Button>
            </Nav>
            <Nav>
              <Navbar.Text>
                <i className="bi bi-wallet2 me-1"></i>
                {account ? `${account}` : "Not Connected"}
              </Navbar.Text>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        {notification.show && (
          <Alert variant={notification.variant} onClose={() => setNotification({ ...notification, show: false })} dismissible>
            <i className={`bi ${notification.variant === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
            {notification.message}
          </Alert>
        )}

        {isSeller ? (
          <Row className="seller-interface">
            {/* Desktop Sidebar */}
            <Col lg={2} className="d-none d-lg-block bg-light sidebar p-0">
              <div className="sidebar-sticky pt-3">
                <h4 className="px-3 mb-3">
                  <i className="bi bi-shop me-2"></i>Seller Panel
                </h4>
                <Nav className="flex-column">
                  <Nav.Link 
                    active={activeTab === "inventory"} 
                    onClick={() => setActiveTab("inventory")}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-clipboard-data me-2"></i> Inventory
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === "add"} 
                    onClick={() => setActiveTab("add")}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-plus-circle me-2"></i> Add Product
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === "restock"} 
                    onClick={() => setActiveTab("restock")}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i> Restock
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === "withdraw"} 
                    onClick={() => setActiveTab("withdraw")}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-cash-stack me-2"></i> Withdraw
                  </Nav.Link>
                </Nav>
                <div className="px-3 mt-3">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setIsSeller(false)}
                    className="w-100"
                  >
                    <i className="bi bi-cart me-1"></i> Switch to Buyer
                  </Button>
                </div>
              </div>
            </Col>

            {/* Mobile Sidebar */}
            {/* <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} responsive="lg" className="bg-light">
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                  <i className="bi bi-shop me-2"></i>Seller Panel
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body className="p-0">
                <Nav className="flex-column">
                  <Nav.Link 
                    active={activeTab === "inventory"} 
                    onClick={() => {
                      setActiveTab("inventory");
                      setShowSidebar(false);
                    }}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-clipboard-data me-2"></i> Inventory
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === "add"} 
                    onClick={() => {
                      setActiveTab("add");
                      setShowSidebar(false);
                    }}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-plus-circle me-2"></i> Add Product
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === "restock"} 
                    onClick={() => {
                      setActiveTab("restock");
                      setShowSidebar(false);
                    }}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i> Restock
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === "withdraw"} 
                    onClick={() => {
                      setActiveTab("withdraw");
                      setShowSidebar(false);
                    }}
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="bi bi-cash-stack me-2"></i> Withdraw
                  </Nav.Link>
                </Nav>
                <div className="px-3 mt-3">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setIsSeller(false);
                      setShowSidebar(false);
                    }}
                    className="w-100"
                  >
                    <i className="bi bi-cart me-1"></i> Switch to Buyer
                  </Button>
                </div>
              </Offcanvas.Body>
            </Offcanvas> */}

            {/* Main Content */}
            <Col lg={10} className="main-content p-4">
              {activeTab === "inventory" && (
                <Card className="shadow-sm mb-4">
                  <Card.Header className="bg-secondary text-white">
                    <i className="bi bi-clipboard-data me-2"></i>Current Inventory
                  </Card.Header>
                  <Card.Body>
                    {products.filter(p => p.quantity > 0).length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-box-seam display-4 text-muted mb-3"></i>
                        <h5>No products in inventory</h5>
                        <p>Add your first product to get started</p>
                        <Button 
                          variant="primary" 
                          onClick={() => setActiveTab("add")}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Add Product
                        </Button>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table striped hover className="mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th><i className="bi bi-hash"></i> ID</th>
                              <th><i className="bi bi-tag"></i> Product</th>
                              <th><i className="bi bi-box-seam"></i> Stock</th>
                              <th><i className="bi bi-currency-dollar"></i> Price</th>
                              <th><i className="bi bi-graph-up"></i> Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.filter(p => p.quantity > 0).map(p => (
                              <tr key={p.id}>
                                <td><Badge bg="dark">#{p.id}</Badge></td>
                                <td className="fw-bold">{p.name}</td>
                                <td>
                                  <Badge bg={p.quantity > 10 ? "success" : "warning"}>
                                    {p.quantity} units
                                  </Badge>
                                </td>
                                <td>{parseFloat(p.price).toFixed(4)} ETH</td>
                                <td>{(p.quantity * p.price).toFixed(4)} ETH</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="table-active">
                              <td colSpan="4" className="text-end fw-bold">Total Inventory Value:</td>
                              <td className="fw-bold">
                                {products.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(4)} ETH
                              </td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {activeTab === "add" && (
                <Card className="shadow-sm mb-4">
                  <Card.Header>
                    <i className="bi bi-plus-circle me-2"></i>Add New Product
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-tag me-1"></i>Product Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="e.g. Chocolate Bar" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                        />
                      </Form.Group>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label><i className="bi bi-box-seam me-1"></i>Quantity</Form.Label>
                            <Form.Control 
                              type="number" 
                              min="1"
                              placeholder="100" 
                              value={quantity} 
                              onChange={(e) => setQuantity(e.target.value)} 
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label><i className="bi bi-currency-exchange me-1"></i>Price (ETH)</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>Ξ</InputGroup.Text>
                              <Form.Control 
                                type="number" 
                                step="0.01"
                                min="0.01"
                                placeholder="0.05" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="d-flex justify-content-between">
                        <Button 
                          variant="primary" 
                          onClick={addProduct}
                          disabled={!name || !quantity || !price}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Add Product
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {activeTab === "restock" && (
                <Card className="shadow-sm mb-4">
                  <Card.Header>
                    <i className="bi bi-arrow-repeat me-2"></i>Restock Product
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-upc-scan me-1"></i>Product ID</Form.Label>
                        <Form.Select
                          value={restockId}
                          onChange={(e) => setRestockId(e.target.value)}
                        >
                          <option value="">Select a product</option>
                          {products.filter(p => p.quantity > 0).map(product => (
                            <option key={product.id} value={product.id}>
                              #{product.id} - {product.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-plus-circle me-1"></i>Additional Quantity</Form.Label>
                        <InputGroup>
                          <InputGroup.Text><i className="bi bi-box-arrow-in-down"></i></InputGroup.Text>
                          <Form.Control 
                            type="number" 
                            min="1"
                            placeholder="50" 
                            value={restockQuantity} 
                            onChange={(e) => setRestockQuantity(e.target.value)} 
                          />
                        </InputGroup>
                      </Form.Group>
                      <div className="d-flex justify-content-between">
                        <Button
                          variant="warning"
                          onClick={restockProduct}
                          disabled={!restockId || !restockQuantity}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Restock
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {activeTab === "withdraw" && (
                <Card className="shadow-sm mb-4">
                  <Card.Header>
                    <i className="bi bi-cash-stack me-2"></i>Withdraw Funds
                  </Card.Header>
                  <Card.Body className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-wallet display-4 text-success mb-3"></i>
                      <h4>Withdraw all collected funds to your wallet</h4>
                      <p className="text-muted">Funds will be sent to your connected wallet address</p>
                    </div>
                    <div className="d-flex justify-content-center gap-3">
                      {/* <Button 
                        variant="secondary" 
                        onClick={() => setActiveTab("inventory")}
                      >
                        <i className="bi bi-arrow-left me-1"></i> Back
                      </Button> */}
                      <Button 
                        variant="success" 
                        onClick={withdrawFunds}
                        className="px-4"
                      >
                        <i className="bi bi-wallet2 me-1"></i> Withdraw Funds
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        ) : (
          <div className="buyer-interface">
            <h2 className="mb-4"><i className="bi bi-cart me-2"></i>Available Products</h2>
            
            <Row xs={1} md={2} lg={3} className="g-4">
              {products
                .filter((p) => p.quantity > 0)
                .map((product) => (
                  <Col key={product.id}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Card.Title className="mb-0">{product.name}</Card.Title>
                          <Badge bg="info">ID: {product.id}</Badge>
                        </div>
                        <Card.Text>
                          <div className="d-flex align-items-center mb-1">
                            <i className="bi bi-box-seam text-muted me-2"></i>
                            <span>Stock: <strong>{product.quantity}</strong></span>
                          </div>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-currency-dollar text-muted me-2"></i>
                            <span>Price: <strong>{product.price} ETH</strong></span>
                          </div>
                        </Card.Text>
                        <Card.Footer className="bg-transparent border-0 mt-auto p-0">
                          <Form.Group className="mb-3">
                            <Form.Label>Quantity</Form.Label>
                            <InputGroup>
                              <Button 
                                variant="outline-secondary" 
                                onClick={() => setBuyerQuantity(Math.max(1, buyerQuantity - 1))}
                              >
                                <i className="bi bi-dash"></i>
                              </Button>
                              <Form.Control
                                type="number"
                                min="1"
                                max={product.quantity}
                                value={buyerQuantity}
                                onChange={(e) => setBuyerQuantity(Math.max(1, Math.min(product.quantity, parseInt(e.target.value) || 1)))}
                                className="text-center"
                              />
                              <Button 
                                variant="outline-secondary" 
                                onClick={() => setBuyerQuantity(Math.min(product.quantity, buyerQuantity + 1))}
                              >
                                <i className="bi bi-plus"></i>
                              </Button>
                            </InputGroup>
                          </Form.Group>
                          <Button 
                            variant="primary" 
                            onClick={() => buyProduct(product.id, product.price)}
                            className="w-100"
                          >
                            <i className="bi bi-cart-plus me-1"></i> 
                            Buy ({parseFloat(product.price * buyerQuantity).toFixed(4)} ETH)
                          </Button>
                        </Card.Footer>
                      </Card.Body>
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