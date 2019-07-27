#include <cstdlib>
#include <iostream>
using namespace std;
int main() {
	malloc(1000000000);
	int a, b;
	cin >> a >> b;
	cout << a + b << endl;
	return 0;
}