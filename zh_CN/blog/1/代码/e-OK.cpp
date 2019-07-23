#include <stdlib.h>
#include <iostream>

using namespace std;

int main() {
	malloc(1000000);
	malloc(1000000);
	cout<<"This program is running."<<endl;
	return 0;
}