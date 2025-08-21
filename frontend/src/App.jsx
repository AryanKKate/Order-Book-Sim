import React, { useEffect, useState } from 'react'
import './App.css'

const API = 'http://127.0.0.1:8080'

function Row({px, row}) {
  return (
    <tr>
      <td>{px}</td>
      <td>{row.totalQty}</td>
      <td>{row.orders.map(o => `${o.id}:${o.qty}`).join(' ')}</td>
    </tr>
  )
}

export default function App() {
  const [side, setSide] = useState('buy')
  const [type, setType] = useState('limit')
  const [price, setPrice] = useState(100)
  const [qty, setQty] = useState(10)
  const [book, setBook] = useState({bids:[], asks:[]})
  const [trades, setTrades] = useState([])
  const [cancelId, setCancelId] = useState('')
  const [msg, setMsg] = useState('')

  async function place(){
    try{
      if (type === 'limit'){
        const r = await fetch(`${API}/order/limit`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({side, price:Number(price), qty:Number(qty)})
        })
        const j = await r.json(); 
        setMsg(j.ok ? `Limit Order Placed (id=${j.id})` : 'Error')
      } else {
        const r = await fetch(`${API}/order/market`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({side, qty:Number(qty)})
        })
        const j = await r.json(); 
        setMsg(j.ok ? `Market Order Placed (id=${j.id})` : 'Error')
      }
    } catch(e){ setMsg('Error placing order') }
  }

  async function cancel(){
    try{
      const r = await fetch(`${API}/order/cancel`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({id:Number(cancelId)})
      })
      const j = await r.json(); 
      setMsg(j.ok ? 'Order Cancelled' : 'Order Not Found')
    } catch(e){ setMsg('Error cancelling order') }
  }

  useEffect(()=>{
    const t = setInterval(async ()=>{
      try{
        const b = await (await fetch(`${API}/book`)).json(); setBook(b)
        const tr = await (await fetch(`${API}/trades`)).json(); setTrades(tr)
      } catch(e){}
    }, 800)
    return ()=>clearInterval(t)
  },[])

  return (
    <div className="app">
      <h1>📈 Order Book Simulator</h1>
      <div className="panels">
        <div className="card">
          <h2>Place Order</h2>
          <label>Side:</label>
          <select value={side} onChange={e=>setSide(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>

          <label>Type:</label>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="limit">Limit</option>
            <option value="market">Market</option>
          </select>

          {type==='limit' && (
            <>
              <label>Price:</label>
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} />
            </>
          )}

          <label>Quantity:</label>
          <input type="number" value={qty} onChange={e=>setQty(e.target.value)} />

          <button onClick={place}>Submit</button>
          <div className="msg">{msg}</div>
        </div>

        <div className="card">
          <h2>Cancel Order</h2>
          <input placeholder="Order ID" value={cancelId} onChange={e=>setCancelId(e.target.value)} />
          <button onClick={cancel}>Cancel</button>
        </div>
      </div>

      <div className="tables">
        <div className="card table-card">
          <h2>Asks (Sellers)</h2>
          <table>
            <thead>
              <tr><th>Price</th><th>Total</th><th>Orders</th></tr>
            </thead>
            <tbody>
              {book.asks.map(row => <Row key={`a-${row.price}`} px={row.price} row={row} />)}
            </tbody>
          </table>
        </div>

        <div className="card table-card">
          <h2>Bids (Buyers)</h2>
          <table>
            <thead>
              <tr><th>Price</th><th>Total</th><th>Orders</th></tr>
            </thead>
            <tbody>
              {book.bids.map(row => <Row key={`b-${row.price}`} px={row.price} row={row} />)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card table-card">
        <h2>Recent Trades</h2>
        <table>
          <thead>
            <tr><th>Buy ID</th><th>Sell ID</th><th>Price</th><th>Qty</th><th>Latency (µs)</th></tr>
          </thead>
          <tbody>
            {trades.map((t,i)=>(
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
