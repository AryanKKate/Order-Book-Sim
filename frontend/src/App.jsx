import React, { useEffect, useState } from 'react'
import './App.css'

// 🔥 PRODUCTION API (replace if needed via env later)
const API = import.meta.env.VITE_API_URL

function Row({ px, row }) {
  return (
    <tr>
      <td>{px}</td>
      <td>{row.totalQty}</td>
      <td className="orders">
        {row.orders.map(o => `${o.id}:${o.qty}`).join(' | ')}
      </td>
    </tr>
  )
}

export default function App() {
  const [side, setSide] = useState('buy')
  const [type, setType] = useState('limit')
  const [price, setPrice] = useState(100)
  const [qty, setQty] = useState(10)

  const [book, setBook] = useState({ bids: [], asks: [] })
  const [trades, setTrades] = useState([])

  const [cancelId, setCancelId] = useState('')
  const [msg, setMsg] = useState('')

  // =========================
  // ORDER ACTIONS
  // =========================
  async function place() {
    try {
      const endpoint =
        type === 'limit' ? '/order/limit' : '/order/market'

      const payload =
        type === 'limit'
          ? { side, price: Number(price), qty: Number(qty) }
          : { side, qty: Number(qty) }

      const r = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const j = await r.json()
      setMsg(j.ok ? `Order placed (ID: ${j.id})` : 'Order failed')
    } catch {
      setMsg('Network error while placing order')
    }
  }

  async function cancel() {
    try {
      const r = await fetch(`${API}/order/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(cancelId) })
      })

      const j = await r.json()
      setMsg(j.ok ? 'Order cancelled' : 'Order not found')
    } catch {
      setMsg('Network error while cancelling')
    }
  }

  // =========================
  // LIVE FEED
  // =========================
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const b = await (await fetch(`${API}/book`)).json()
        const tr = await (await fetch(`${API}/trades`)).json()

        setBook(b)
        setTrades(tr)
      } catch (e) {
        // silent fail for demo stability
      }
    }, 800)

    return () => clearInterval(t)
  }, [])

  // =========================
  // UI
  // =========================
  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <h1>📊 Order Book Simulator</h1>
        <p>C++ Matching Engine • Live Market Simulation</p>
      </header>

      {/* CONTROL PANEL */}
      <div className="grid">
        <div className="card">
          <h2>Place Order</h2>

          <label>Side</label>
          <select value={side} onChange={e => setSide(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>

          <label>Type</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="limit">Limit</option>
            <option value="market">Market</option>
          </select>

          {type === 'limit' && (
            <>
              <label>Price</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </>
          )}

          <label>Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />

          <button onClick={place}>Submit Order</button>

          {msg && <div className="msg">{msg}</div>}
        </div>

        <div className="card">
          <h2>Cancel Order</h2>

          <label>Order ID</label>
          <input
            placeholder="Enter order ID"
            value={cancelId}
            onChange={e => setCancelId(e.target.value)}
          />

          <button className="danger" onClick={cancel}>
            Cancel Order
          </button>
        </div>
      </div>

      {/* ORDER BOOK */}
      <div className="book-grid">
        <div className="card table-card sell">
          <h2>Asks (Sell Side)</h2>
          <table>
            <thead>
              <tr>
                <th>Price</th>
                <th>Qty</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {book.asks.map(row => (
                <Row key={`a-${row.price}`} px={row.price} row={row} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="card table-card buy">
          <h2>Bids (Buy Side)</h2>
          <table>
            <thead>
              <tr>
                <th>Price</th>
                <th>Qty</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {book.bids.map(row => (
                <Row key={`b-${row.price}`} px={row.price} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRADES */}
      <div className="card table-card">
        <h2>Recent Trades</h2>
        <table>
          <thead>
            <tr>
              <th>Buy ID</th>
              <th>Sell ID</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Latency (µs)</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i}>
                <td>{t.buyId}</td>
                <td>{t.sellId}</td>
                <td>{t.price}</td>
                <td>{t.qty}</td>
                <td>{t.latencyMicros}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}