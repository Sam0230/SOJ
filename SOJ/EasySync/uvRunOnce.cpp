#include <node.h>
#include <uv.h>

using namespace v8;

void wait(const FunctionCallbackInfo<Value>& args) {
	uv_run(uv_default_loop(), UV_RUN_ONCE);
}

void init(Local<Object> exports) {
	NODE_SET_METHOD(exports, "uvRunOnce", wait);
}

NODE_MODULE(addon, init)