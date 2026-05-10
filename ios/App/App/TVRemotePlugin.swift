import Capacitor
import Foundation

@objc(TVRemotePlugin)
public class TVRemotePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TVRemotePlugin"
    public let jsName = "TVRemote"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPermissionState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "discoverDevices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addManualDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pairDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listPairedDevices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removePairedDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "validateDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "testPlay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "armPlay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelArmedPlay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendPlayNow", returnType: CAPPluginReturnPromise)
    ]

    private let engine = TVRemoteEngine()

    @objc func getPermissionState(_ call: CAPPluginCall) {
        call.resolve(["localNetwork": engine.localNetworkPermissionState()])
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        call.resolve(["localNetwork": engine.localNetworkPermissionState()])
    }

    @objc func discoverDevices(_ call: CAPPluginCall) {
        call.resolve(["devices": engine.discoverManualOnly()])
    }

    @objc func addManualDevice(_ call: CAPPluginCall) {
        do {
            let protocolId = call.getString("protocol") ?? "manual"
            let host = call.getString("host") ?? ""
            let port = call.getInt("port")
            let device = try engine.addManualDevice(protocolId: protocolId, host: host, port: port)
            call.resolve(device)
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func pairDevice(_ call: CAPPluginCall) {
        call.resolve(["ok": false, "requiresPin": false, "errorCode": "PAIRING_NOT_IMPLEMENTED", "errorMessage": "Pairing is scaffolded; hardware flow is not enabled yet."])
    }

    @objc func listPairedDevices(_ call: CAPPluginCall) {
        call.resolve(["devices": engine.registry.list()])
    }

    @objc func removePairedDevice(_ call: CAPPluginCall) {
        let deviceId = call.getString("deviceId") ?? ""
        engine.registry.remove(id: deviceId)
        call.resolve(["ok": true])
    }

    @objc func validateDevice(_ call: CAPPluginCall) {
        let deviceId = call.getString("deviceId") ?? ""
        engine.validateDevice(deviceId: deviceId) { result in
            call.resolve(result)
        }
    }

    @objc func testPlay(_ call: CAPPluginCall) {
        let deviceId = call.getString("deviceId") ?? ""
        engine.testPlay(deviceId: deviceId) { result in
            call.resolve(result)
        }
    }

    @objc func armPlay(_ call: CAPPluginCall) {
        let countdownId = call.getString("countdownId") ?? ""
        let deviceId = call.getString("deviceId") ?? ""
        let playAtServerMs = call.getDouble("playAtServerMs") ?? 0
        let playAtMonotonicMs = call.getDouble("playAtMonotonicMs") ?? 0
        engine.armPlay(countdownId: countdownId, deviceId: deviceId, playAtServerMs: playAtServerMs, playAtMonotonicMs: playAtMonotonicMs) { result in
            call.resolve(result)
        }
    }

    @objc func cancelArmedPlay(_ call: CAPPluginCall) {
        let countdownId = call.getString("countdownId") ?? ""
        let deviceId = call.getString("deviceId") ?? ""
        call.resolve(["ok": engine.commandScheduler.cancel(countdownId: countdownId, deviceId: deviceId)])
    }

    @objc func sendPlayNow(_ call: CAPPluginCall) {
        let countdownId = call.getString("countdownId") ?? ""
        let deviceId = call.getString("deviceId") ?? ""
        engine.sendPlayNow(countdownId: countdownId, deviceId: deviceId) { result in
            call.resolve(result)
        }
    }
}
