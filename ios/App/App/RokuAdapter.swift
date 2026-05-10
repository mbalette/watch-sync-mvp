import Foundation

final class RokuAdapter {
    func validate(device: PairedTVDevice, completion: @escaping ([String: Any]) -> Void) {
        guard let host = device.host else {
            completion(["ok": false, "deviceId": device.id, "capabilities": [], "errorCode": "HOST_REQUIRED", "errorMessage": "Roku IP is required."])
            return
        }
        request(host: host, path: "/query/device-info", method: "GET") { result in
            switch result {
            case .success:
                completion(["ok": true, "deviceId": device.id, "capabilities": ["play", "testCommand"]])
            case .failure(let error):
                completion(["ok": false, "deviceId": device.id, "capabilities": [], "errorCode": "ROKU_VALIDATE_FAILED", "errorMessage": error.localizedDescription])
            }
        }
    }

    func sendPlay(device: PairedTVDevice, completion: @escaping ([String: Any]) -> Void) {
        guard let host = device.host else {
            completion(failure(protocolId: device.protocolId, code: "HOST_REQUIRED", message: "Roku IP is required."))
            return
        }
        request(host: host, path: "/keypress/Play", method: "POST") { result in
            switch result {
            case .success:
                completion(["ok": true, "protocol": device.protocolId, "command": "play", "sentAtMonotonicMs": Date().timeIntervalSince1970 * 1000, "completedAtMonotonicMs": Date().timeIntervalSince1970 * 1000])
            case .failure(let error):
                completion(self.failure(protocolId: device.protocolId, code: "ROKU_PLAY_FAILED", message: error.localizedDescription))
            }
        }
    }

    private func request(host: String, path: String, method: String, completion: @escaping (Result<Data, Error>) -> Void) {
        guard let url = URL(string: "http://\(host):8060\(path)") else { completion(.failure(ValidationError("Invalid Roku URL."))); return }
        var request = URLRequest(url: url, timeoutInterval: 2.5)
        request.httpMethod = method
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error { completion(.failure(error)); return }
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { completion(.failure(ValidationError("Roku returned non-2xx response."))); return }
            completion(.success(data ?? Data()))
        }.resume()
    }

    private func failure(protocolId: String, code: String, message: String) -> [String: Any] {
        ["ok": false, "protocol": protocolId, "command": "play", "sentAtMonotonicMs": Date().timeIntervalSince1970 * 1000, "errorCode": code, "errorMessage": message]
    }
}
