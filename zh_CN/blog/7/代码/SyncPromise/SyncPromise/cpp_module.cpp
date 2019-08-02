#include <math.h>
#include <node.h>
#include <time.h>
#include <uv.h>
#include <node_buffer.h>

using namespace v8;
using namespace node;

void naddmain(const FunctionCallbackInfo<Value>& args) {
	char* detach_required = (char *) Buffer::Data(args[0]);
	char* reached_timeout = (char *) Buffer::Data(args[1]);
	char* pending = (char *) Buffer::Data(args[2]);
	uv_loop_t *default_loop = uv_default_loop();
	while (detach_required[0] == '0' && reached_timeout[0] == '0' && pending[0] == '1' && uv_loop_alive(default_loop)) {
		uv_run(default_loop, UV_RUN_ONCE);
	}
}

void init(Local<Object> exports, Local<Object> module) {
	NODE_SET_METHOD(module, "exports", naddmain);
}
NODE_MODULE(addon, init)