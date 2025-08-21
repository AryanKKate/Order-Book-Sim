# OrderBook Simulator — C++ API + React UI

This is a **well-structured starter kit** for an Order Book simulator with a **C++ REST API** backend and a **React (Vite)** frontend.

> ⚠️ The C++ backend uses two single-header libraries you must download locally:
> - cpp-httplib: https://github.com/yhirose/cpp-httplib (download `httplib.h`)
> - nlohmann/json: https://github.com/nlohmann/json (download `single_include/nlohmann/json.hpp`)
>
> Put both files into: `backend-cpp/external/`

## Project Layout
```
orderbook-app/
├─ backend-cpp/
│  ├─ main.cpp
│  ├─ external/
│  │  ├─ httplib.h         # PLACE HERE (downloaded)
│  │  └─ json.hpp          # PLACE HERE (downloaded)
│  └─ CMakeLists.txt
└─ frontend-react/
   ├─ package.json
   ├─ vite.config.js
   ├─ index.html
   └─ src/
      ├─ main.jsx
      └─ App.jsx
```

## Backend — Build & Run
```bash
cd backend-cpp
# Option A: g++
g++ -std=gnu++17 -O2 -pthread main.cpp -o server
./server

# Option B: CMake
cmake -S . -B build && cmake --build build -j
./build/server
```
It listens on `http://127.0.0.1:8080`.

## Frontend — Run Dev Server
```bash
cd frontend-react
npm install
npm run dev
```
Open the printed local URL (often `http://127.0.0.1:5173`). The UI polls the backend every 500 ms.

## API Endpoints
- `POST /order/limit` body: `{ "side": "buy"|"sell", "price": 101, "qty": 50 }`
- `POST /order/market` body: `{ "side": "buy"|"sell", "qty": 70 }`
- `POST /order/cancel` body: `{ "id": 123 }`
- `GET  /book` snapshot of order book
- `GET  /trades` list of trades
