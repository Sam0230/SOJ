#include <iostream>
#include <fstream>

using namespace std;

string replace(const string str, string s1, string s2, bool repeatedly) {
	string ret = str, temp;
	bool equal;
	for (size_t i = 0; i < ret.size(); i++) {
		if (i + s1.size() > ret.size()) {
			break;
		}
		equal = true;
		for (size_t j = 0; j < s1.size(); j++) {
			if (ret[i + j] != s1[j]) {
				equal = false;
				break;
			}
		}
		if (equal) {
			temp = "";
			for (size_t j = 0; j < i; j++) {
				temp += ret[j];
			}
			temp += s2;
			for (size_t j = i + s1.size(); j < ret.size(); j++) {
				temp += ret[j];
			}
			ret = temp;
			i--;
			if (!repeatedly) {
				i += s2.size();
			}
		}
	}
	return ret;
}

int main(int argc, char **argv) {
	ifstream intput(argv[1]);
	ifstream output(argv[2]);
	ifstream answer(argv[3]);
	ofstream result(argv[4]);
	ofstream additionalinf(argv[5]);
	string out, out_oneline, ans, ans_oneline, temp;
	int len, newline = 0;
	while (!output.eof()) {
		getline(output, temp);
		len = temp.size();
		while (--len != -1 && (temp[len] == '\t' || temp[len] == ' '));
		++len;
		if (len == 0) {
			newline++;
		} else {
			out += '\n';
			for (int i = 0; i < newline; i++) {
				out += '\n';
			}
			newline = 0;
		}
		for (int i = 0; i < len; ++i) {
			out += temp[i];
		}
	}
	out_oneline = replace(replace(out, "\n", " ", true) + " ", "  ", " ", true);
	newline = 0;
	while (!answer.eof()) {
		getline(answer, temp);
		len = temp.size();
		while (--len != -1 && (temp[len] == '\t' || temp[len] == ' '));
		++len;
		if (len == 0) {
			newline++;
		} else {
			ans += '\n';
			for (int i = 0; i < newline; i++) {
				ans += '\n';
			}
			newline = 0;
		}
		for (int i = 0; i < len; ++i) {
			ans += temp[i];
		}
	}
	ans_oneline = replace(replace(ans, "\n", " ", true) + " ", "  ", " ", true);
	if (out == ans) {
		result << "AC 100";
		return 0;
	}
	if (out_oneline == ans_oneline) {
		result << "PE 10";
		return 0;
	}
	result << "WA 0";
	return 0;
}