use napi::JsUndefined;
use napi::{bindgen_prelude::*, JsGlobal, JsObject, JsString};

pub(crate) fn console_log(env: &Env, message: &str) -> Result<JsUndefined> {
  let global: JsGlobal = env.get_global()?;
  let console: JsObject = global.get_named_property("console")?;
  let log_fn: JsFunction = console.get_named_property("log")?;
  let js_string: JsString = env.create_string(message)?;
  log_fn.call(None, &[js_string])?;
  env.get_undefined()
}
