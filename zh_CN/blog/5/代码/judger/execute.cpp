/*
This program contains a sandbox, a memory usage monitor, and an input / output redirector.
Programs under test will be executed by this program.
*/
#include <sys/mman.h>
#include <sys/ptrace.h>
#include <sys/reg.h>
#include <sys/resource.h>
#include <sys/syscall.h>
#include <sys/wait.h>
#include <unistd.h>
#include <bits/stdc++.h>

using namespace std;

unsigned long long cpuclock() {
	timespec ts = {0, 0};
	unsigned long long time;
	clock_gettime(CLOCK_MONOTONIC, &ts);
	time = ts.tv_sec * 1000000 + ts.tv_nsec / 1000;
	return time;
}

int getvirtualmemoryusage(const pid_t pid) {
	int ret = -1;
	string str;
	stringstream sstm;
	sstm << "/proc/" << pid << "/status";
	ifstream fin(sstm.str().c_str());
	if (!fin) {
		return -1;
	}
	while (!fin.eof()) {
		fin >> str;
		if (str == "VmSize:") {
			fin >> str;
			sstm.str("");
			sstm.clear();
			sstm << str;
			sstm >> ret;
		}
	}
	if (ret != -1) {
		ret *= 1000;
		ret /= 1024;
	}
	return ret;
}

int main(int argc, char **argv) {
	if (!strcmp(argv[0], "EXEC_TEST")) {
		putchar(0);
		return 0;
	}
	int timelimit, memorylimit, syscallbasecount[428] = {0}, syscallcount[428] = {0}, orig_rax, memoryusage = 0, begintime, timespent = 0, childstatus, piper[2], pipew[2], pipee[2], *psystemerror;
	pid_t childpid, childpid2;
	char *exec = new char[0], *root = new char[0], *inputfile = new char[0], *outputfile = new char[0], temp[8192], *incorrectness = new char[0], *retval = new char[0];
	bool syscall_allowed[428];
	ifstream fin, inputfin;
	ofstream fout, outputfout;
	srand(cpuclock());
	psystemerror = (int *) mmap(NULL, sizeof (*psystemerror), PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
	(*psystemerror) = 0;
	fout.open(argv[2]);
	if (system("ls /root >/dev/null 2>/dev/null")) {
		fout << "PLEASE RUN AS ROOT!";
		return -1;
	}
	fin.open(argv[1]);
	fin >> timelimit >> memorylimit >> inputfile >> outputfile >> root >> exec;
	pipe(piper);
	pipe(pipew);
	pipe(pipee);
	syscall_allowed[SYS_read] = true;
	syscall_allowed[SYS_write] = true;
	syscall_allowed[SYS_time] = true;
	syscall_allowed[SYS_brk] = true;
	syscall_allowed[SYS_exit_group] = true;
	syscall_allowed[SYS_mmap] = true;
	syscall_allowed[SYS_munmap] = true;
	// For pipe
	syscallbasecount[SYS_fstat] = 1;
	syscallbasecount[SYS_lseek] = 1;
#ifndef __x86_64__
	syscallbasecount[SYS_fstat64] = 1;
	syscallbasecount[SYS__llseek] = 1;
#endif
	// For throw
	syscallbasecount[SYS_rt_sigprocmask] = 6;
	syscallbasecount[SYS_getpid] = 2;
	syscallbasecount[SYS_gettid] = 2;
	syscallbasecount[SYS_tgkill] = 2;
	syscallbasecount[SYS_rt_sigaction] = 1;
	childpid = fork();
	if (childpid == -1) {
		fout << "ERROR" << endl << 1 << endl << 0;
		return -1;
	}
	if (childpid == 0) {
		if (chroot(root)) {
			(*psystemerror) = 1;
			return -1;
		}
		if (setgid(rand() % 1000000000 + 10000)) { // % 1000000000 + 10000: Provent the GID from equal with an authentic existed GID. The same below.
			(*psystemerror) = 3;
			return -1;
		}
		if (setuid(rand() % 1000000000 + 10000)) {
			(*psystemerror) = 4;
			return -1;
		}
		rlimit rlim;
		rlim.rlim_cur = 0;
		rlim.rlim_max = 0;
		if (setrlimit(RLIMIT_FSIZE, &rlim)) {
			(*psystemerror) = 5;
			return -1;
		}
		if (setrlimit(RLIMIT_CORE, &rlim)) {
			(*psystemerror) = 6;
			return -1;
		}
		if (setrlimit(RLIMIT_NICE, &rlim)) {
			(*psystemerror) = 7;
			return -1;
		}
		if (setrlimit(RLIMIT_LOCKS, &rlim)) {
			(*psystemerror) = 8;
			return -1;
		}
		if (setrlimit(RLIMIT_NPROC, &rlim)) {
			(*psystemerror) = 9;
			return -1;
		}
		rlim.rlim_cur = 1024 * memorylimit;
		rlim.rlim_max = 1024 * memorylimit;
		if (setrlimit(RLIMIT_STACK, &rlim)) {
			(*psystemerror) = 10;
			return -1;
		}
		if (ptrace(PTRACE_TRACEME, 0, NULL, NULL)) {
			(*psystemerror) = 11;
			return -1;
		}
		execle(argv[0], "EXEC_TEST", NULL, NULL);
		(*psystemerror) = 12;
		return -1;
	}
	while (true) {
		waitpid(childpid, &childstatus, 0);
		if (WIFSIGNALED(childstatus)) {
			fout << "ERROR" << endl << 1 << endl << 13;
			return -1;
		}
		if (WIFEXITED(childstatus)) {
			break;
		}
#ifdef __x86_64__
		orig_rax = ptrace(PTRACE_PEEKUSER, childpid, 8 * ORIG_RAX, NULL);
#else
		orig_rax = ptrace(PTRACE_PEEKUSER, childpid, 4 * ORIG_EAX, NULL);
#endif
		if (!syscall_allowed[orig_rax]) {
			// fout << orig_rax << endl;
			syscallbasecount[orig_rax]++;
		}
		ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
		waitpid(childpid, &childstatus, 0);
		ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
	}
	childpid = fork();
	if (childpid == -1) {
		fout << "ERROR" << endl << 2 << endl << 0;
		return -1;
	}
	if (childpid == 0) {
		dup2(piper[0], 0);
		close(piper[0]);
		close(piper[1]);
		dup2(pipew[1], 1);
		close(pipew[0]);
		close(pipew[1]);
		dup2(pipee[1], 2);
		close(pipee[0]);
		close(pipee[1]);
		if (chroot(root)) {
			(*psystemerror) = 1;
			return -1;
		}
		if (chdir("/")) {
			(*psystemerror) = 2;
			return -1;
		}
		if (setgid(rand() % 1000000000 + 10000)) {
			(*psystemerror) = 3;
			return -1;
		}
		if (setuid(rand() % 1000000000 + 10000)) {
			(*psystemerror) = 4;
			return -1;
		}
		rlimit rlim;
		rlim.rlim_cur = 0;
		rlim.rlim_max = 0;
		if (setrlimit(RLIMIT_FSIZE, &rlim)) {
			(*psystemerror) = 5;
			return -1;
		}
		if (setrlimit(RLIMIT_CORE, &rlim)) {
			(*psystemerror) = 6;
			return -1;
		}
		if (setrlimit(RLIMIT_NICE, &rlim)) {
			(*psystemerror) = 7;
			return -1;
		}
		if (setrlimit(RLIMIT_LOCKS, &rlim)) {
			(*psystemerror) = 8;
			return -1;
		}
		if (setrlimit(RLIMIT_NPROC, &rlim)) {
			(*psystemerror) = 9;
			return -1;
		}
		rlim.rlim_cur = 1024 * memorylimit;
		rlim.rlim_max = 1024 * memorylimit;
		if (setrlimit(RLIMIT_STACK, &rlim)) {
			(*psystemerror) = 10;
			return -1;
		}
		if (ptrace(PTRACE_TRACEME, 0, NULL, NULL)) {
			(*psystemerror) = 11;
			return -1;
		}
		execle(exec, "", NULL, NULL);
		(*psystemerror) = 12;
		return -1;
	}
	childpid2 = fork();
	if (childpid == -1) {
		fout << "ERROR" << endl << 2 << endl << 13;
		return -1;
	}
	if (childpid2 == 0) {
		usleep((timelimit + 200) * 1250);
		waitpid(childpid, NULL, WNOHANG) ? (kill(childpid, SIGKILL)) : (0);
		return 0;
	}
	close(piper[0]);
	close(pipew[1]);
	close(pipee[1]);
	FILE* in = fdopen(piper[1], "wb");
	FILE* out = fdopen(pipew[0], "rb");
	inputfin.open(inputfile, ios::binary);
	if (inputfin.fail()) {
		kill(childpid, SIGKILL);
		kill(childpid2, SIGKILL);
		fout << "ERROR" << endl << 2 << endl << 14;
		return -1;
	}
	while (!inputfin.eof()) {
		inputfin.read(temp, sizeof(temp));
		fputs(temp, in);
	}
	putc('\n', in);
	fflush(in);
	retval = (char *) "null";
	incorrectness = (char *) "null";
	while (true) {
		if (*psystemerror) {
			kill(childpid2, SIGKILL);
			fout << "ERROR" << endl << 2 << endl << (*psystemerror);
			return -1;
		}
		begintime = cpuclock();
		waitpid(childpid, &childstatus, 0);
		timespent += cpuclock() - begintime;
		if (timespent > timelimit * 1000) {
			kill(childpid2, SIGKILL);
			incorrectness = (char *) "\"TLE\"";
			break;
		}
#ifdef __x86_64__
		orig_rax = ptrace(PTRACE_PEEKUSER, childpid, 8 * ORIG_RAX, NULL);
#else
		orig_rax = ptrace(PTRACE_PEEKUSER, childpid, 4 * ORIG_EAX, NULL);
#endif
		if ((orig_rax == SYS_brk || orig_rax == SYS_mmap)) {
			memoryusage = max(memoryusage, getvirtualmemoryusage(childpid));
			if (memoryusage > memorylimit) {
				kill(childpid2, SIGKILL);
				incorrectness = (char *) "\"MLE\"";
				break;
			}
		}
		if ((childstatus >> 8) != SIGTRAP) {
			kill(childpid2, SIGKILL);
			incorrectness = (char *) "\"RE\"";
			break;
		}
		if (!syscall_allowed[orig_rax]) {
			/*
			ofstream fffout("DEBUG_syscall", ios::app);
			fffout << orig_rax << endl;
			fffout.close();
			*/
			syscallcount[orig_rax]++;
			if (syscallcount[orig_rax] > syscallbasecount[orig_rax]) {
				kill(childpid2, SIGKILL);
				incorrectness = (char *) "\"RF\"";
				break;
			}
		}
		ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
		begintime = cpuclock();
		waitpid(childpid, &childstatus, 0);
		timespent += cpuclock() - begintime;
		if (timespent > timelimit * 1000) {
			kill(childpid2, SIGKILL);
			incorrectness = (char *) "\"TLE\"";
			break;
		}
#ifdef __x86_64__
		orig_rax = ptrace(PTRACE_PEEKUSER, childpid, 8 * ORIG_RAX, NULL);
#else
		orig_rax = ptrace(PTRACE_PEEKUSER, childpid, 4 * ORIG_EAX, NULL);
#endif
		if (orig_rax == SYS_exit_group) {
			ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
			waitpid(childpid, &childstatus, 0);
			kill(childpid2, SIGKILL);
			retval = (char *) to_string(childstatus >> 8).c_str();
			break;
		}
		ptrace(PTRACE_SYSCALL, childpid, NULL, NULL);
	}
	if (*psystemerror) {
		kill(childpid2, SIGKILL);
		fout << "ERROR" << endl << 2 << endl << (*psystemerror);
		return -1;
	}
	ptrace(PTRACE_KILL, childpid, NULL, NULL);
	fout << "{ \"time\": " << timespent / 1000 << ", \"memoryUsage\": " << memoryusage << ", \"incorrectness\": " << incorrectness << ", \"ret\": " << retval << " }";
	outputfout.open(outputfile, ios::binary);
	if (outputfout.fail()) {
		fout << "ERROR" << endl << 2 << endl << 15;
		return -1;
	}
	while (fgets(temp, sizeof (temp), out)) {
		outputfout << temp;
	}
	return 0;
}