#!/bin/bash
echo "可用：OK, RF, RE, TLE, MLE。你想测试哪一个程序？"
read ex
echo 输入格式：
echo 时间限制/ms 内存限制/KiB 根 被测程序
echo "echo 1000 131072 . /test >in"
echo 1000 131072 . /test >in
echo g++ sandbox_and_limits.cpp -o sandbox_and_limits --static
g++ sandbox_and_limits.cpp -o sandbox_and_limits --static
echo g++ e-$ex.cpp -o test --static
g++ e-$ex.cpp -o test --static
echo sudo ./sandbox_and_limits in out
cat e-$ex.cpp
echo ""
rm out -f
sudo ./sandbox_and_limits in out
echo 输出格式：
echo 用时/ms
echo 内存占用/KiB
echo 信号值
echo 返回值
echo cat out
cat out
echo ""
read