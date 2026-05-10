import Foundation

enum ManualIpDiscovery {
    static func normalizeHost(_ host: String) throws -> String {
        let trimmed = host.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { throw ValidationError("TV host/IP is required.") }
        if trimmed.contains("://") || trimmed.contains("/") || trimmed.contains("@") || trimmed.contains("?") || trimmed.contains("#") { throw ValidationError("Enter only a host/IP, not a URL, path, or credentials.") }
        let allowed = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._:-")
        if trimmed.rangeOfCharacter(from: allowed.inverted) != nil { throw ValidationError("Host contains unsupported characters.") }
        return trimmed
    }
}

struct ValidationError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}
