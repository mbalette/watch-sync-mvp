import Foundation

struct PairedTVDevice: Codable {
    let id: String
    let protocolId: String
    let displayName: String
    let host: String?
    let port: Int?
    let pairedAt: TimeInterval
    var lastValidatedAt: TimeInterval?
    let capabilities: [String]

    var asDictionary: [String: Any] {
        var dict: [String: Any] = ["id": id, "protocol": protocolId, "displayName": displayName, "pairedAt": pairedAt, "capabilities": capabilities]
        if let host { dict["host"] = host }
        if let port { dict["port"] = port }
        if let lastValidatedAt { dict["lastValidatedAt"] = lastValidatedAt }
        return dict
    }
}

final class DeviceRegistry {
    private let key = "tech.kyrosdirect.play321.tvremote.devices"
    private var devices: [String: PairedTVDevice] = [:]

    init() { load() }

    func save(_ device: PairedTVDevice) {
        devices[device.id] = device
        persist()
    }

    func get(id: String) -> PairedTVDevice? { devices[id] }

    func markValidated(id: String) {
        guard var device = devices[id] else { return }
        device.lastValidatedAt = Date().timeIntervalSince1970
        devices[id] = device
        persist()
    }

    func remove(id: String) {
        devices.removeValue(forKey: id)
        persist()
    }

    func list() -> [[String: Any]] { devices.values.map { $0.asDictionary } }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key), let decoded = try? JSONDecoder().decode([String: PairedTVDevice].self, from: data) else { return }
        devices = decoded
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(devices) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }
}
