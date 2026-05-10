import Foundation

final class VizioSmartCastAdapter {
    func testPlay(device: PairedTVDevice, credentialStore: CredentialStore, completion: @escaping ([String: Any]) -> Void) {
        // Scaffold only: real VIZIO pairing/token command path remains hardware-unverified.
        completion(["ok": false, "protocol": device.protocolId, "command": "play", "sentAtMonotonicMs": Date().timeIntervalSince1970 * 1000, "errorCode": "VIZIO_HARDWARE_UNVERIFIED", "errorMessage": "VIZIO native adapter is scaffolded. Pairing/token command path needs real TV validation."])
    }
}
