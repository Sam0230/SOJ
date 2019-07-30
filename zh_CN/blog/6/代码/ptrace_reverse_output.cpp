#include <errno.h>
#include <stdio.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <iostream>
#include <algorithm>
#include <unistd.h>
#include <sys/user.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <syscall.h>
#include <sys/ptrace.h>

using namespace std;

#define FATAL(...) \
    do { \
        fprintf(stderr, "ERROR: " __VA_ARGS__); \
        fputc('\n', stderr); \
        exit(EXIT_FAILURE); \
    } while (0)


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
void getdata(pid_t child, unsigned long addr, char *str, int len) {
	char *laddr;
	int i = 0, n = len / regsize;
	union u {
		long val;
		char chars[regsize];
	} data;
	laddr = str;
	while (i < n) {
		data.val = ptrace(PTRACE_PEEKDATA, child, addr + i * regsize, NULL);
		memcpy(laddr, data.chars, regsize);
		++i;
		laddr += regsize;
	}
	n = len % regsize;
	if (n != 0) {
		data.val = ptrace(PTRACE_PEEKDATA, child, addr + i * regsize, NULL);
		memcpy(laddr, data.chars, n);
	}
	str[len] = '\0';
}
int main(int argc, char **argv) {
	if (argc <= 1)
		FATAL("too few arguments: %d", argc);

	pid_t pid = fork();
	switch (pid) {
		case -1: /* error */
			FATAL("%s", strerror(errno));
		case 0:  /* child */
			ptrace(PTRACE_TRACEME, 0, 0, 0);
			execvp(argv[1], argv + 1);
			FATAL("%s", strerror(errno));
	}

	/* parent */
	waitpid(pid, 0, 0); // sync with PTRACE_TRACEME
	ptrace(PTRACE_SETOPTIONS, pid, 0, PTRACE_O_EXITKILL);

	while (true) {
		/* Enter next system call */
		if (ptrace(PTRACE_SYSCALL, pid, 0, 0) == -1)
			FATAL("%s", strerror(errno));
		if (waitpid(pid, 0, 0) == -1)
			FATAL("%s", strerror(errno));

		/* Gather system call arguments */
		struct user_regs_struct regs;
		if (ptrace(PTRACE_GETREGS, pid, 0, &regs) == -1)
			FATAL("%s", strerror(errno));
#ifdef __x86_64__
		unsigned long syscall = regs.orig_rax;
#else
		unsigned long syscall = regs.orig_eax;
#endif

		/* Print a representation of the system call */
		if (syscall == SYS_write) {
			char a[100];
#ifdef __x86_64__
			getdata(pid, regs.rsi, a, regs.rdx);
			fprintf(stderr, "#%s#", a);
			std::reverse(a, a + regs.rdx);
			fprintf(stderr, "%s#", a);
			putdata(pid, regs.rsi, a, regs.rdx);
#else
			getdata(pid, regs.esi, a, regs.edx);
			fprintf(stderr, "#%s#", a);
			reverse(a, a + regs.edx);
			fprintf(stderr, "%s#", a);
			putdata(pid, regs.esi, a, regs.edx);
#endif
		}
		fprintf(stderr, "%ld(%ld, %ld, %ld, %ld, %ld, %ld)",
		        syscall,
#ifdef __x86_64__
		        (unsigned long)regs.rdi, (unsigned long)regs.rsi, (unsigned long)regs.rdx, (unsigned long)regs.rcx, (unsigned long)regs.r8,  (unsigned long)regs.r9);
#else
		        (unsigned long)regs.edi, (unsigned long)regs.esi, (unsigned long)regs.edx, (unsigned long)regs.ecx, 0,  0);
#endif

		/* Run system call and stop on exit */
		if (ptrace(PTRACE_SYSCALL, pid, 0, 0) == -1)
			FATAL("%s", strerror(errno));
		if (waitpid(pid, 0, 0) == -1)
			FATAL("%s", strerror(errno));

		/* Get system call result */
		if (ptrace(PTRACE_GETREGS, pid, 0, &regs) == -1) {
			fputs(" = ?\n", stderr);
			if (errno == ESRCH)
#ifdef __x86_64__
				exit(regs.rdi); // system call was _exit(2) or similar
#else
				exit(regs.edi); // system call was _exit(2) or similar
#endif
			FATAL("%s", strerror(errno));
		}

		/* Print system call result */
#ifdef __x86_64__
		fprintf(stderr, " = %ld\n", (long)regs.rax);
#else
		fprintf(stderr, " = %ld\n", (long)regs.eax);
#endif
	}
}