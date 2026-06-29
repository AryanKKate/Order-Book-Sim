cmake_minimum_required(VERSION 3.14)

project(orderbook_api)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(server
    main.cpp
    MarketStatistics.cpp
)

find_package(Threads REQUIRED)

target_link_libraries(server PRIVATE Threads::Threads)