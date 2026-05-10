import Foundation

final class TVRemoteEngine {
    let registry = DeviceRegistry()
    let credentials = CredentialStore(service: "tech.kyrosdirect.play321.tvremote")
    let commandScheduler = CommandScheduler()
    private let roku = RokuAdapter()
    private let vizio = VizioSmartCastAdapter()

    func localNetworkPermissionState() -> String {
        // iOS exposes Local Network consent through the first motivated LAN access; there is no stable direct status API.
        return "unknown"
    }

    func discoverManualOnly() -> [[String: Any]] {
        return [["id": "manual-countdown", "protocol": "manual", "displayName": "Manual countdown", "requiresPairing": false, "capabilities": []]]
    }

    func addManualDevice(protocolId: String, host: String, port: Int?) throws -> [String: Any] {
        let cleanHost = try ManualIpDiscovery.normalizeHost(host)
        let device = PairedTVDevice(id: "\(protocolId):\(cleanHost):\(port ?? 0)", protocolId: protocolId, displayName: "\(protocolId) device (\(cleanHost))", host: cleanHost, port: port, pairedAt: Date().timeIntervalSince1970, lastValidatedAt: nil, capabilities: protocolId == "roku-ecp" ? ["play", "testCommand"] : [])
        registry.save(device)
        return device.asDictionary
    }

    func validateDevice(deviceId: String, completion: @escaping ([String: Any]) -> Void) {
        guard let device = registry.get(id: deviceId) else {
            completion(["ok": false, "deviceId": deviceId, "capabilities": [], "errorCode": "DEVICE_NOT_FOUND", "errorMessage": "Device not found."])
            return
        }
        if device.protocolId == "roku-ecp" {
            roku.validate(device: device) { [weak self] result in
                if result["ok"] as? Bool == true {
                    self?.registry.markValidated(id: deviceId)
                }
                completion(result)
            }
        } else {
            completion(["ok": false, "deviceId": deviceId, "capabilities": [], "errorCode": "ADAPTER_NOT_IMPLEMENTED", "errorMessage": "This adapter is scaffolded only."])
        }
    }

    func testPlay(deviceId: String, completion: @escaping ([String: Any]) -> Void) {
        guard let device = registry.get(id: deviceId) else {
            completion(commandFailure(protocolId: "manual", code: "DEVICE_NOT_FOUND", message: "Device not found."))
            return
        }
        if device.protocolId == "roku-ecp" {
            roku.sendPlay(device: device, completion: completion)
        } else if device.protocolId == "vizio-smartcast" {
            vizio.testPlay(device: device, credentialStore: credentials, completion: completion)
        } else {
            completion(commandFailure(protocolId: device.protocolId, code: "ADAPTER_NOT_IMPLEMENTED", message: "Adapter scaffolded; use manual countdown."))
        }
    }

    func armPlay(countdownId: String, deviceId: String, playAtServerMs: Double, playAtMonotonicMs: Double, completion: @escaping ([String: Any]) -> Void) {
        guard let device = registry.get(id: deviceId), device.lastValidatedAt != nil else {
            completion(["ok": false, "deviceId": deviceId, "countdownId": countdownId, "armedForMonotonicMs": playAtMonotonicMs, "errorCode": "DEVICE_NOT_VALIDATED", "errorMessage": "Run Test Play and confirm it started before arming Auto Play."])
            return
        }
        commandScheduler.arm(countdownId: countdownId, device: device, playAtServerMs: playAtServerMs, playAtMonotonicMs: playAtMonotonicMs, fire: { [weak self] firedDevice, done in
            self?.testPlay(deviceId: firedDevice.id, completion: done)
        }, completion: completion)
    }

    func sendPlayNow(countdownId: String, deviceId: String, completion: @escaping ([String: Any]) -> Void) {
        guard let device = registry.get(id: deviceId), device.lastValidatedAt != nil else {
            completion(commandFailure(protocolId: "manual", code: "DEVICE_NOT_VALIDATED", message: "Run Test Play and confirm it started before sending Play."))
            return
        }
        commandScheduler.sendNow(countdownId: countdownId, device: device) { [weak self] firedDevice, done in
            self?.testPlay(deviceId: firedDevice.id, completion: done)
        } completion: { result in
            completion(result)
        }
    }

    private func commandFailure(protocolId: String, code: String, message: String) -> [String: Any] {
        return ["ok": false, "protocol": protocolId, "command": "play", "sentAtMonotonicMs": Date().timeIntervalSince1970 * 1000, "errorCode": code, "errorMessage": message]
    }
}
