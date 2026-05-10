package tech.kyrosdirect.play321

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "TVRemote")
class TVRemotePlugin : Plugin() {
    @PluginMethod fun getPermissionState(call: PluginCall) { call.resolve(JSObject().put("localNetwork", "not_required")) }
    @PluginMethod fun requestPermissions(call: PluginCall) { call.resolve(JSObject().put("localNetwork", "not_required")) }
    @PluginMethod fun discoverDevices(call: PluginCall) { call.resolve(JSObject().put("devices", JSArray().put(manualCandidate()))) }
    @PluginMethod fun addManualDevice(call: PluginCall) {
        val protocol = call.getString("protocol", "manual") ?: "manual"
        val host = call.getString("host", "") ?: ""
        if (protocol != "manual" && host.isBlank()) {
            call.reject("TV host/IP is required.")
            return
        }
        call.resolve(JSObject().put("id", "$protocol:$host").put("protocol", protocol).put("displayName", if (protocol == "manual") "Manual countdown" else "$protocol device ($host)").put("host", host).put("requiresPairing", protocol != "roku-ecp").put("capabilities", JSArray()))
    }
    @PluginMethod fun pairDevice(call: PluginCall) { call.resolve(unavailable("PAIRING_NOT_IMPLEMENTED", "Android pairing scaffold exists but is not implemented yet.")) }
    @PluginMethod fun listPairedDevices(call: PluginCall) { call.resolve(JSObject().put("devices", JSArray())) }
    @PluginMethod fun removePairedDevice(call: PluginCall) { call.resolve(JSObject().put("ok", true)) }
    @PluginMethod fun validateDevice(call: PluginCall) { call.resolve(unavailable("ADAPTER_NOT_IMPLEMENTED", "Android native adapter validation is scaffolded only.")) }
    @PluginMethod fun testPlay(call: PluginCall) { call.resolve(commandUnavailable("ADAPTER_NOT_IMPLEMENTED", "Android native Test Play is scaffolded only.")) }
    @PluginMethod fun armPlay(call: PluginCall) { call.resolve(JSObject().put("ok", false).put("deviceId", call.getString("deviceId", "") ?: "").put("countdownId", call.getString("countdownId", "") ?: "").put("armedForMonotonicMs", call.getDouble("playAtMonotonicMs", 0.0)).put("errorCode", "ADAPTER_NOT_IMPLEMENTED").put("errorMessage", "Android native Auto Play arming is scaffolded only.")) }
    @PluginMethod fun cancelArmedPlay(call: PluginCall) { call.resolve(JSObject().put("ok", true)) }
    @PluginMethod fun sendPlayNow(call: PluginCall) { call.resolve(commandUnavailable("ADAPTER_NOT_IMPLEMENTED", "Android native sendPlayNow is scaffolded only.")) }

    private fun manualCandidate() = JSObject().put("id", "manual-countdown").put("protocol", "manual").put("displayName", "Manual countdown").put("requiresPairing", false).put("capabilities", JSArray())
    private fun unavailable(code: String, message: String) = JSObject().put("ok", false).put("errorCode", code).put("errorMessage", message)
    private fun commandUnavailable(code: String, message: String) = unavailable(code, message).put("protocol", "manual").put("command", "play").put("sentAtMonotonicMs", System.currentTimeMillis().toDouble())
}
