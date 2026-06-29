import React, { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

function Row({ row }) {
  return (
    <tr>
      <td>{row.price}</td>
      <td>{row.totalQty}</td>
      <td className="orders">
        {row.orders.map((o) => `${o.id}:${o.qty}`).join(" | ")}
      </td>
    </tr>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <h2>{value}</h2>
    </div>
  );
}

export default function App() {
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("limit");
  const [price, setPrice] = useState(100);
  const [qty, setQty] = useState(10);

  const [cancelId, setCancelId] = useState("");

  const [book, setBook] = useState({
    bids: [],
    asks: [],
  });

  const [trades, setTrades] = useState([]);

  const [stats, setStats] = useState(null);

  const [msg, setMsg] = useState("");

  // ----------------------------
  // PLACE ORDER
  // ----------------------------

  async function place() {
    try {
      const endpoint =
        type === "limit"
          ? "/order/limit"
          : "/order/market";

      const payload =
        type === "limit"
          ? {
              side,
              price: Number(price),
              qty: Number(qty),
            }
          : {
              side,
              qty: Number(qty),
            };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      setMsg(
        json.ok
          ? `Order placed successfully (ID ${json.id})`
          : "Order failed"
      );
    } catch {
      setMsg("Network Error");
    }
  }

  // ----------------------------
  // CANCEL ORDER
  // ----------------------------

  async function cancel() {
    try {
      const res = await fetch(`${API}/order/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(cancelId),
        }),
      });

      const json = await res.json();

      setMsg(
        json.ok
          ? "Order Cancelled"
          : "Order Not Found"
      );
    } catch {
      setMsg("Network Error");
    }
  }

  // ----------------------------
  // LIVE POLLING
  // ----------------------------

  useEffect(() => {
    async function fetchData() {
      try {
        const [b, tr, st] = await Promise.all([
          fetch(`${API}/book`).then((r) => r.json()),
          fetch(`${API}/trades`).then((r) => r.json()),
          fetch(`${API}/stats`).then((r) => r.json()),
        ]);

        setBook(b);
        setTrades(tr);
        setStats(st);
      } catch {}
    }

    fetchData();

    const timer = setInterval(fetchData, 700);

    return () => clearInterval(timer);
  }, []);

  // ----------------------------
  // UI
  // ----------------------------

  return (
    <div className="app">

      <header className="header">
        <h1>Order Book Simulator</h1>

        <p>
          High Performance C++ Matching Engine
        </p>

        <span>
          Price-Time Priority • REST API • Live Market
        </span>
      </header>

      {/* ===================================== */}
      {/* MARKET OVERVIEW */}
      {/* ===================================== */}

      <div className="stats-grid">

        <StatCard
          title="Last Trade"
          value={stats?.lastTradePrice ?? "--"}
        />

        <StatCard
          title="VWAP"
          value={
            stats
              ? stats.vwap.toFixed(2)
              : "--"
          }
        />

        <StatCard
          title="Spread"
          value={stats?.spread ?? "--"}
        />

        <StatCard
          title="Mid Price"
          value={
            stats
              ? stats.midPrice.toFixed(2)
              : "--"
          }
        />

        <StatCard
          title="Volume"
          value={stats?.totalVolume ?? "--"}
        />

        <StatCard
          title="Trades"
          value={stats?.tradeCount ?? "--"}
        />

      </div>

      {/* ===================================== */}
      {/* MAIN GRID */}
      {/* ===================================== */}

      <div className="main-grid">

        {/* LEFT PANEL */}

        <div className="card">

          <h2>Order Entry</h2>

          <label>Side</label>

          <select
            value={side}
            onChange={(e) =>
              setSide(e.target.value)
            }
          >
            <option value="buy">BUY</option>
            <option value="sell">SELL</option>
          </select>

          <label>Order Type</label>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >
            <option value="limit">
              LIMIT
            </option>

            <option value="market">
              MARKET
            </option>
          </select>

          {type === "limit" && (
            <>
              <label>Price</label>

              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
              />
            </>
          )}

          <label>Quantity</label>

          <input
            type="number"
            value={qty}
            onChange={(e) =>
              setQty(e.target.value)
            }
          />

          <button onClick={place}>
            Submit Order
          </button>

          <hr />

          <h3>Cancel Order</h3>

          <input
            placeholder="Order ID"
            value={cancelId}
            onChange={(e) =>
              setCancelId(e.target.value)
            }
          />

          <button
            className="danger"
            onClick={cancel}
          >
            Cancel
          </button>

          {msg && (
            <div className="msg">
              {msg}
            </div>
          )}
        </div>

        {/* ORDER BOOK */}

        <div className="card">

          <h2>Live Order Book</h2>

          <div className="book-grid">

            <div className="sell">

              <h3>ASKS</h3>

              <table>

                <thead>

                  <tr>

                    <th>Price</th>

                    <th>Qty</th>

                    <th>Orders</th>

                  </tr>

                </thead>

                <tbody>

                  {book.asks.map((row) => (
                    <Row
                      key={row.price}
                      row={row}
                    />
                  ))}

                </tbody>

              </table>

            </div>

            <div className="buy">

              <h3>BIDS</h3>

              <table>

                <thead>

                  <tr>

                    <th>Price</th>

                    <th>Qty</th>

                    <th>Orders</th>

                  </tr>

                </thead>

                <tbody>

                  {book.bids.map((row) => (
                    <Row
                      key={row.price}
                      row={row}
                    />
                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* MARKET STATS */}

        <div className="card">

          <h2>Market Statistics</h2>

          <div className="stat-row">
            <span>Open</span>
            <strong>{stats?.open ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>High</span>
            <strong>{stats?.high ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>Low</span>
            <strong>{stats?.low ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>Close</span>
            <strong>{stats?.close ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>Best Bid</span>
            <strong>{stats?.bestBid ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>Best Ask</span>
            <strong>{stats?.bestAsk ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>Bid Depth</span>
            <strong>{stats?.bidDepth ?? "--"}</strong>
          </div>

          <div className="stat-row">
            <span>Ask Depth</span>
            <strong>{stats?.askDepth ?? "--"}</strong>
          </div>

        </div>

      </div>

      {/* ===================================== */}
      {/* RECENT TRADES */}
      {/* ===================================== */}

      <div className="card trades-card">

        <h2>Recent Trades</h2>

        <table>

          <thead>

            <tr>

              <th>Buy ID</th>

              <th>Sell ID</th>

              <th>Price</th>

              <th>Quantity</th>

              <th>Latency (μs)</th>

            </tr>

          </thead>

          <tbody>

            {trades.map((trade, index) => (

              <tr key={index}>

                <td>{trade.buyId}</td>

                <td>{trade.sellId}</td>

                <td>{trade.price}</td>

                <td>{trade.qty}</td>

                <td>{trade.latencyMicros}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}