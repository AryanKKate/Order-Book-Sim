# 📈 Order Book Simulator (C++ + React)

A high-performance **Limit Order Book Simulator** built with a **C++ backend** (low-latency matching engine) and a **React frontend** (interactive trading dashboard).  

This project demonstrates **quantitative trading systems, market microstructure, and real-time systems programming**, with a clean and usable interface for order management.

---

## 🚀 Features

- **Limit & Market Orders**  
  - Place buy/sell limit orders at specific price levels.  
  - Place buy/sell market orders that execute against the best available price.  

- **Order Management**  
  - Cancel active orders by ID.  
  - Track live order book depth (bids & asks).  

- **Matching Engine**  
  - Efficient `O(log n)` order insertion using C++ STL maps.  
  - Price-time priority matching with immediate trade execution.  
  - Microsecond latency tracking per trade.  

- **Frontend Dashboard (React)**  
  - Place & cancel orders via an intuitive UI.  
  - Live order book tables for **bids (buyers)** and **asks (sellers)**.  
  - Recent trades with execution latency display.  

- **Lightweight API (REST)**  
  - `POST /order/limit` → Place a limit order.  
  - `POST /order/market` → Place a market order.  
  - `POST /order/cancel` → Cancel an order.  
  - `GET /book` → Fetch current order book.  
  - `GET /trades` → Fetch recent trades.  

---

## ⚙️ Tech Stack

- **Backend (C++)**  
  - Matching engine written in **modern C++17**  
  - REST server using [cpp-httplib](https://github.com/yhirose/cpp-httplib)  
  - Data structures: `map`, `deque`, `priority_queue`  
  - Optimized for low-latency, high-throughput order matching  

- **Frontend (React)**  
  - React + JavaScript with **fetch API**  
  - Live polling of backend every ~800ms  
  - Clean UI styled with vanilla CSS  

---

## 📦 Installation & Setup

### 🔹 Prerequisites

Make sure you have installed:

- **C++ Compiler**  
  - Linux/macOS → `g++` (GCC 9+ recommended)  
  - Windows → [MinGW-w64](https://sourceforge.net/projects/mingw-w64/)  

Check installation:
```bash
g++ --version
```

- **Node.js & npm**  
  Install from [Node.js official site](https://nodejs.org/en/download).  

Check installation:
```bash
node -v
npm -v
```

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/orderbook-simulator.git
cd orderbook-simulator
```

---

### 2️⃣ Backend (C++ Server)

```bash
cd backend-cpp

# Compile backend
g++ -std=c++17 -O2 -pthread -D_WIN32_WINNT=0x0A00 -DHTTPLIB_NO_MMAP main.cpp -o server

# Run backend
./server
```

By default, the backend runs on **http://127.0.0.1:8080**

---

### 3️⃣ Frontend (React UI)

```bash
cd ../frontend-react

# Install dependencies
npm install

# Start frontend
npm run dev
```

The frontend runs at **http://localhost:5173** (default Vite port).  

---

## 🖥️ Usage

- Start the backend server (`./server`).  
- Start the React frontend (`npm run dev`).  
- Open browser → [http://localhost:5173](http://localhost:5173).  
- Place/cancel orders and observe live **order book** & **trades** update.  

---

## 📊 UI

- **Place Orders**: Choose side (Buy/Sell), type (Limit/Market), price, and quantity.  
- **Cancel Orders**: Enter an order ID to cancel.  
- **Order Book View**: Shows bids (highest first) and asks (lowest first).  
- **Trade History**: Displays executed trades with latency measurements.  

---

## 🔮 Possible Extensions

- WebSocket streaming for real-time UI updates  
- Depth chart & price chart visualization  
- User accounts & portfolio tracking  
- Advanced order types (stop-loss, iceberg, hidden)  
- Replay mode with historical tick data  

---


