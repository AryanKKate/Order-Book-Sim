#pragma once

#include <unordered_map>
#include <climits>
#include "external/json.hpp"

using json = nlohmann::json;

struct ExecutionSummary
{
    int filledQty = 0;

    long long tradedValue = 0;

    double averagePrice() const
    {
        if(filledQty == 0)
            return 0;

        return (double)tradedValue / filledQty;
    }
};

class MarketStatistics
{
private:

    long long totalVolume = 0;

    long double totalTurnover = 0;

    int lastTradePrice = 0;

    int openPrice = -1;

    int highPrice = INT_MIN;

    int lowPrice = INT_MAX;

    int closePrice = 0;

    long long tradeCount = 0;

    std::unordered_map<long long, ExecutionSummary> executionHistory;

public:

    void recordTrade(
        long long buyId,
        long long sellId,
        int price,
        int qty
    );

    json marketSnapshot(
        int bestBid,
        int bestAsk,
        int bidDepth,
        int askDepth
    ) const;

    json orderSummary(long long id) const;

    double getVWAP() const;
};