#include <sys/mman.h>
#include <sys/ptrace.h>
#include <sys/reg.h>
#include <sys/resource.h>
#include <sys/syscall.h>
#include <sys/user.h>
#include <sys/wait.h>
#include <unistd.h>
#include <bits/stdc++.h>

using namespace std;

#ifdef __x86_64__
#define regsize 8
#else
#define regsize 4
#endif

void putdata(pid_t child, unsigned long addr, char *str, int len) {
	char *laddr;
	int i = 0, n = len / regsize;
	union u {
		long val;
		char chars[regsize];
	} data;
	laddr = str;
	while (i < n) {
		memcpy(data.chars, laddr, regsize);
		ptrace(PTRACE_POKEDATA, child, addr + i * regsize, data.val);
		++i;
		laddr += regsize;
	}
	n = len % regsize;
	if (n != 0) {
		memcpy(data.chars, laddr, n);
		ptrace(PTRACE_POKEDATA, child, addr + i * regsize, data.val);
	}
}

void getdata(pid_t pid, unsigned long addr, char *str, int len) {
	int n = len / regsize;
	union u {
		long val;
		char data[regsize];
	} data;
	for (int i = 0; i <= n; i++) {
		data.val = ptrace(PTRACE_PEEKDATA, pid, addr + (i * regsize), NULL);
		for (int k = 0; k < regsize && i * regsize + k < len; k++) {
			str[0] = data.data[k];
			str++;
		}
	}
}

int getdata(pid_t pid, unsigned long addr, char *str) {
	union u {
		long val;
		char data[regsize];
	} data;
	for (int i = 0; true; i++) {
		data.val = ptrace(PTRACE_PEEKDATA, pid, addr + (i * regsize), NULL);
		for (int k = 0; k < regsize; k++) {
			if (data.data[k] == 0) {
				return i * regsize + k;
			}
			str[0] = data.data[k];
			str++;
		}
	}
	return -1;
}

int main(int argc, char **argv) {
	char data[1000];
	bool *pexecerror, allowed;
	unsigned long syscall;
	string temp;
	pid_t childpid, childpid2;
	int childstatus, origlen, pipew[2], pipee[2];
	user_regs_struct regs;
	pexecerror = (bool *) mmap(NULL, sizeof (*pexecerror), PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
	*pexecerror = false;
	pipe(pipew);
	pipe(pipee);
	childpid = fork();
	if (childpid == -1) {
		cout << "ERROR\n1";
		return -1;
	}
	if (childpid == 0) {
		dup2(pipew[1], 1);
		close(pipew[0]);
		close(pipew[1]);
		dup2(pipee[1], 2);
		close(pipee[0]);
		close(pipee[1]);
		ptrace(PTRACE_TRACEME, 0, 0, 0);
		execvp(argv[4], argv + 4);
		*pexecerror = true;
		return -1;
	}
	close(pipew[1]);
	close(pipee[1]);
	FILE* out = fdopen(pipew[0], "rb");
	FILE* err = fdopen(pipee[0], "rb");
	childpid2 = fork();
	if (childpid2 == -1) {
		cout << "ERROR\n2";
		return -1;
	}
	if (childpid2 == 0) {
		ofstream fout(argv[2], ios::binary);
		while (fgets(data, sizeof (data), out)) {
			fout << data;
		}
		fout.close();
		fout.open(argv[1], ios::binary);
		while (data[0] = fgetc(err)) {
			if (data[0] == -1) {
				break;
			}
			fout << data[0];
		}
		return 0;
	}
	while (true) {
		if (*pexecerror) {
			cout << "ERROR\n3";
			return -1;
		}
		waitpid(childpid, &childstatus, 0);
		if (WIFSIGNALED(childstatus)) {
			cout << "ERROR\n3";
			return -1;
		}
		if (WIFEXITED(childstatus)) {
			break;
		}
		ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
		waitpid(childpid, &childstatus, 0);
		ptrace(PTRACE_GETREGS, childpid, NULL, &regs);
#ifdef __x86_64__
		syscall = regs.orig_rax;
#else
		syscall = regs.orig_eax;
#endif
		if (syscall == SYS_openat) {
#ifdef __x86_64__
			getdata(childpid, regs.rsi, data);
#else
			getdata(childpid, regs.esi, data);
#endif
			temp = data;
			allowed = false;
			if (temp.find(argv[3]) == 0 || temp == "/etc/ld.so.cache" || temp.find("/usr/lib/") == 0 || temp.find("/usr/libx32/") == 0 || temp.find("/usr/lib32/") == 0 || temp.find("/usr/lib64/") == 0 || temp.find("/lib/") == 0 || temp.find("/libx32/") == 0 || temp.find("/lib32/") == 0 || temp.find("/lib64/") == 0 || temp.find("/usr/include/") == 0 || temp.find("/usr/local/include/") == 0 || temp.find("/usr/share/locale/") == 0) {
				allowed = true;
			}
			if (!allowed) {
				cout << data << "\n";
#ifdef __x86_64__
				putdata(childpid, regs.rsi, (char *) "/dev/null\0", strlen("/dev/null") + 1);
#else
				putdata(childpid, regs.esi, (char *) "/dev/null\0", strlen("/dev/null") + 1);
#endif
			}
		}
		ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
	}
	waitpid(childpid2, NULL, 0);
	return 0;
}