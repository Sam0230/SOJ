#!/bin/bash
echo 请把你想测试的程序复制一份，重命名为test.cpp，然后按下回车。
echo 输入格式：
echo 时间限制/ms 内存限制/KiB 输入文件 输出文件 根 被测程序
echo "echo 1000 131072 input output rootdir /test >test_parameter"
echo 1000 131072 input output rootdir /test >test_parameter
echo ./compile.sh
./compile.sh
echo g++ test.cpp -o rootdir/test --static
g++ test.cpp -o rootdir/test --static
echo sudo ./sandbox_limits_and_io_redirect test_parameter test_result
rm -f test_result output
sudo ./sandbox_limits_and_io_redirect test_parameter test_result
echo ""
echo 输出格式：
echo 用时/ms
echo 内存占用/KiB
echo 信号值
echo 返回值
echo ""
echo cat test_result
cat test_result
echo ""
echo ""
echo 程序输出：
echo "cat output"
cat output
echo ""
if [ "$(diff -ZB output output-ans)" != "" ]; then
	echo 未通过
else
	echo AC
fi
read