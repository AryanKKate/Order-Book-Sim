#include "MarketStatistics.h"

void MarketStatistics::recordTrade(
    long long buyId,
    long long sellId,
    int price,
    int qty
)
{
    tradeCount++;

    lastTradePrice = price;

    closePrice = price;

    if(openPrice == -1)
        openPrice = price;

    if(price > highPrice)
        highPrice = price;

    if(price < lowPrice)
        lowPrice = price;

    totalVolume += qty;

    totalTurnover +=
        (long double)price * qty;

    executionHistory[buyId].filledQty += qty;
    executionHistory[buyId].tradedValue +=
        (long long)price * qty;

    executionHistory[sellId].filledQty += qty;
    executionHistory[sellId].tradedValue +=
        (long long)price * qty;
}

double MarketStatistics::getVWAP() const
{
    if(totalVolume == 0)
        return 0;

    return (double)
        (totalTurnover / totalVolume);
}

json MarketStatistics::marketSnapshot(
    int bestBid,
    int bestAsk,
    int bidDepth,
    int askDepth
) const
{
    json j;

    j["lastTradePrice"] = lastTradePrice;

    j["vwap"] = getVWAP();

    j["totalVolume"] = totalVolume;

    j["turnover"] = (double)totalTurnover;

    j["tradeCount"] = tradeCount;

    j["bestBid"] = bestBid;

    j["bestAsk"] = bestAsk;

    j["spread"] =
        bestAsk == 0 || bestBid == 0 ?
        0 :
        bestAsk - bestBid;

    j["midPrice"] =
        bestAsk == 0 || bestBid == 0 ?
        0 :
        (bestAsk + bestBid) / 2.0;

    j["open"] = openPrice;

    j["high"] =
        highPrice == INT_MIN ?
        0 :
        highPrice;

    j["low"] =
        lowPrice == INT_MAX ?
        0 :
        lowPrice;

    j["close"] = closePrice;

    j["bidDepth"] = bidDepth;

    j["askDepth"] = askDepth;

    return j;
}

json MarketStatistics::orderSummary(
    long long id
) const
{
    auto it =
        executionHistory.find(id);

    if(it == executionHistory.end())
    {
        return {
            {"exists", false}
        };
    }

    json j;

    j["exists"] = true;

    j["filledQty"] =
        it->second.filledQty;

    j["averageExecutionPrice"] =
        it->second.averagePrice();

    j["tradedValue"] =
        it->second.tradedValue;

    return j;
}