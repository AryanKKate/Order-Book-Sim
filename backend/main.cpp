#include <bits/stdc++.h>
#include "external/httplib.h"     
#include "external/json.hpp"       

using json = nlohmann::json;
using namespace std;
using Clock = std::chrono::high_resolution_clock;
using Micros = std::chrono::microseconds;

enum class Side { Buy, Sell }; enum class Type { Limit, Market };

struct Order {
    long long id; Side side; Type type; int price; int qty; int orig_qty;
    Clock::time_point t_recv;
    Order(long long i, Side s, Type t, int p, int q)
        : id(i), side(s), type(t), price(p), qty(q), orig_qty(q), t_recv(Clock::now()) {}
};

struct Trade { long long buyId, sellId; int price, qty; Micros latency; };

template <typename Cmp>
class BookSide {
public:
    map<int, deque<Order>, Cmp> levels; // price -> FIFO orders
    bool empty() const { return levels.empty(); }
    auto best_it() { return levels.begin(); }
    int best_price() const { return levels.begin()->first; }
    void add(const Order &o){ levels[o.price].push_back(o); }
};

class OrderBook {
    BookSide<less<int>> asks;            
    BookSide<greater<int>> bids;        

    struct Handle { Side side; int price; };
    unordered_map<long long, Handle> idx; 

    vector<Trade> trades;
    long long nextId = 1;
    mutable std::mutex mtx; 

public:
    long long place_limit(Side s, int price, int qty){
        lock_guard<mutex> lk(mtx);
        Order o(nextId++, s, Type::Limit, price, qty);
        route_and_match(o);
        if (o.qty>0) rest(o);
        return o.id;
    }
    long long place_market(Side s, int qty){
        lock_guard<mutex> lk(mtx);
        Order o(nextId++, s, Type::Market, 0, qty);
        route_and_match(o);
        return o.id;
    }
    bool cancel(long long id){
        lock_guard<mutex> lk(mtx);
        auto it = idx.find(id);
        if (it==idx.end()) return false;
        auto [side, price] = it->second;
        if (side==Side::Buy){
            auto pit = bids.levels.find(price);
            if (pit==bids.levels.end()) { idx.erase(it); return false; }
            auto &dq = pit->second;
            for (auto qit=dq.begin(); qit!=dq.end(); ++qit){
                if (qit->id==id){ dq.erase(qit); if (dq.empty()) bids.levels.erase(pit); idx.erase(it); return true; }
            }
        } else {
            auto pit = asks.levels.find(price);
            if (pit==asks.levels.end()) { idx.erase(it); return false; }
            auto &dq = pit->second;
            for (auto qit=dq.begin(); qit!=dq.end(); ++qit){
                if (qit->id==id){ dq.erase(qit); if (dq.empty()) asks.levels.erase(pit); idx.erase(it); return true; }
            }
        }
        return false;
    }

    // API snapshots
    json book_snapshot() const {
        lock_guard<mutex> lk(mtx);
        json jb;
        jb["bids"] = json::array(); jb["asks"] = json::array();
        for (auto &kv : bids.levels){ int px = kv.first; int tot=0; json orders=json::array();
            for (auto &o : kv.second){ if(o.qty>0){ tot+=o.qty; orders.push_back({{"id",o.id},{"qty",o.qty}});} }
            if(tot>0) jb["bids"].push_back({{"price",px},{"totalQty",tot},{"orders",orders}});
        }
        for (auto &kv : asks.levels){ int px = kv.first; int tot=0; json orders=json::array();
            for (auto &o : kv.second){ if(o.qty>0){ tot+=o.qty; orders.push_back({{"id",o.id},{"qty",o.qty}});} }
            if(tot>0) jb["asks"].push_back({{"price",px},{"totalQty",tot},{"orders",orders}});
        }
        return jb;
    }
    json trades_snapshot() const {
        lock_guard<mutex> lk(mtx);
        json jt = json::array();
        for (auto &t: trades){
            jt.push_back({{"buyId",t.buyId},{"sellId",t.sellId},{"price",t.price},{"qty",t.qty},{"latencyMicros",t.latency.count()}});
        }
        return jt;
    }

private:
    void route_and_match(Order &in){
        if (in.side==Side::Buy) match(in, asks, bids);
        else                    match(in, bids, asks);
    }

    template <typename MakerCmp, typename TakerCmp>
    void match(Order &taker, BookSide<MakerCmp> &makerSide, BookSide<TakerCmp> &/*takerSide*/){
        while (taker.qty>0 && !makerSide.empty()){
            int bestPx = makerSide.best_price();
            if (taker.type==Type::Limit){
                if (taker.side==Side::Buy && taker.price<bestPx) break;
                if (taker.side==Side::Sell && taker.price>bestPx) break;
            }
            auto it = makerSide.best_it();
            auto &q = it->second;
            while (taker.qty>0 && !q.empty()){
                auto &mk = q.front();
                int execQty = min(taker.qty, mk.qty);
                int execPx  = it->first;
                mk.qty -= execQty; taker.qty -= execQty;
                Micros lat = chrono::duration_cast<Micros>(Clock::now() - taker.t_recv);
                trades.push_back({ (taker.side==Side::Buy? taker.id: mk.id), (taker.side==Side::Sell? taker.id: mk.id), execPx, execQty, lat });
                if (mk.qty==0){ idx.erase(mk.id); q.pop_front(); }
            }
            if (q.empty()) makerSide.levels.erase(it);
        }
    }

    void rest(const Order &o){
        if (o.side==Side::Buy){ bids.add(o); idx[o.id] = {Side::Buy, o.price}; }
        else { asks.add(o); idx[o.id] = {Side::Sell, o.price}; }
    }
};


int main(){
    OrderBook ob;
    httplib::Server svr;

   
    svr.set_default_headers({{"Access-Control-Allow-Origin","*"},
                             {"Access-Control-Allow-Methods","GET,POST,OPTIONS"},
                             {"Access-Control-Allow-Headers","Content-Type"}});
    svr.Options("/.*", [](const httplib::Request&, httplib::Response &res){ res.status = 204; });

    svr.Post("/order/limit", [&](const httplib::Request &req, httplib::Response &res){
        try{
            auto j = json::parse(req.body);
            string side = j.value("side", "buy");
            int price = j.at("price"); int qty = j.at("qty");
            auto id = ob.place_limit( (side=="buy"? Side::Buy: Side::Sell), price, qty );
            res.set_content(json({{"ok",true},{"id",id}}).dump(), "application/json");
        } catch(const std::exception &e){
            res.status=400; res.set_content(json({{"ok",false},{"error",e.what()}}).dump(),"application/json");
        }
    });

    svr.Post("/order/market", [&](const httplib::Request &req, httplib::Response &res){
        try{
            auto j = json::parse(req.body);
            string side = j.value("side", "buy");
            int qty = j.at("qty");
            auto id = ob.place_market( (side=="buy"? Side::Buy: Side::Sell), qty );
            res.set_content(json({{"ok",true},{"id",id}}).dump(), "application/json");
        } catch(const std::exception &e){
            res.status=400; res.set_content(json({{"ok",false},{"error",e.what()}}).dump(),"application/json");
        }
    });

    svr.Post("/order/cancel", [&](const httplib::Request &req, httplib::Response &res){
        try{
            auto j = json::parse(req.body);
            long long id = j.at("id");
            bool ok = ob.cancel(id);
            res.set_content(json({{"ok",ok}}).dump(), "application/json");
        } catch(const std::exception &e){
            res.status=400; res.set_content(json({{"ok",false},{"error",e.what()}}).dump(),"application/json");
        }
    });

    svr.Get("/book", [&](const httplib::Request&, httplib::Response &res){
        res.set_content(ob.book_snapshot().dump(), "application/json");
    });

    svr.Get("/trades", [&](const httplib::Request&, httplib::Response &res){
        res.set_content(ob.trades_snapshot().dump(), "application/json");
    });

    // cout << "C++ OrderBook API listening on http://127.0.0.1:8080\n";
    svr.listen("0.0.0.0", 8080);
}
