import Foundation

final class CommandScheduler {
    private var firedKeys: [String: Date] = [:]
    private var pending: [String: DispatchWorkItem] = [:]

    func arm(countdownId: String, device: PairedTVDevice, playAtServerMs: Double, playAtMonotonicMs: Double, fire: @escaping (PairedTVDevice, @escaping ([String: Any]) -> Void) -> Void, completion: @escaping ([String: Any]) -> Void) {
        let key = idempotencyKey(countdownId: countdownId, deviceId: device.id)
        pruneFiredKeys()
        guard firedKeys[key] == nil else {
            completion(["ok": false, "deviceId": device.id, "countdownId": countdownId, "armedForMonotonicMs": playAtMonotonicMs, "errorCode": "PLAY_ALREADY_SENT", "errorMessage": "One Play command was already sent for this countdown."])
            return
        }
        let delay = max(0, (playAtMonotonicMs - ProcessInfo.processInfo.systemUptime * 1000) / 1000)
        let work = DispatchWorkItem { [weak self] in
            self?.firedKeys[key] = Date()
            fire(device) { _ in }
        }
        pending[key] = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
        completion(["ok": true, "deviceId": device.id, "countdownId": countdownId, "armedForMonotonicMs": playAtMonotonicMs])
    }

    func sendNow(countdownId: String, device: PairedTVDevice, fire: @escaping (PairedTVDevice, @escaping ([String: Any]) -> Void) -> Void, completion: @escaping ([String: Any]) -> Void) {
        let key = idempotencyKey(countdownId: countdownId, deviceId: device.id)
        pruneFiredKeys()
        guard firedKeys[key] == nil else {
            completion(["ok": false, "protocol": device.protocolId, "command": "play", "sentAtMonotonicMs": Date().timeIntervalSince1970 * 1000, "errorCode": "PLAY_ALREADY_SENT", "errorMessage": "One Play command was already sent for this countdown."])
            return
        }
        firedKeys[key] = Date()
        fire(device, completion)
    }

    func cancel(countdownId: String, deviceId: String) -> Bool {
        let key = idempotencyKey(countdownId: countdownId, deviceId: deviceId)
        pending[key]?.cancel()
        pending.removeValue(forKey: key)
        return true
    }

    private func idempotencyKey(countdownId: String, deviceId: String) -> String { "\(countdownId):\(deviceId):play" }

    private func pruneFiredKeys() {
        let cutoff = Date().addingTimeInterval(-300)
        firedKeys = firedKeys.filter { $0.value > cutoff }
    }
}
