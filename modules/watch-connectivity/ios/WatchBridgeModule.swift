import ExpoModulesCore

#if canImport(WatchConnectivity) && !targetEnvironment(macCatalyst)
import WatchConnectivity

/// Native owns WCSession, JS owns Supabase. The module pushes the App-Group
/// `cr_*` snapshot (already written by `widget-sync`) to the watch, and forwards
/// the watch's minute/page log messages up to JS as an `onWatchLog` event — the
/// JS half (which holds the Supabase session) runs the RPC.
public class WatchBridgeModule: Module {
  private let group = "group.com.whalesrecords.colophon"
  private lazy var delegate = WatchSessionDelegate { [weak self] payload in
    self?.sendEvent("onWatchLog", payload)
  }

  public func definition() -> ModuleDefinition {
    Name("WatchBridgeModule")
    Events("onWatchLog")

    OnCreate {
      if WCSession.isSupported() {
        WCSession.default.delegate = self.delegate
        WCSession.default.activate()
      }
    }

    // Push the current-read + goal snapshot to the watch.
    Function("push") { (session: String?) in
      guard WCSession.default.activationState == .activated else { return }
      let d = UserDefaults(suiteName: self.group)
      var ctx: [String: Any] = [
        "cr_active": d?.integer(forKey: "cr_active") ?? 0,
        "cr_title": d?.string(forKey: "cr_title") ?? "",
        "cr_author": d?.string(forKey: "cr_author") ?? "",
        "cr_page": d?.integer(forKey: "cr_page") ?? 0,
        "cr_total": d?.integer(forKey: "cr_total") ?? 0,
        "cr_pct": d?.integer(forKey: "cr_pct") ?? 0,
        "cr_minutesToday": d?.integer(forKey: "cr_minutesToday") ?? 0,
        "goal": d?.integer(forKey: "goal") ?? 20,
        "today": d?.integer(forKey: "today") ?? 0,
        "streak": d?.integer(forKey: "streak") ?? 0,
      ]
      if let s = session { ctx["cr_session"] = s }
      try? WCSession.default.updateApplicationContext(ctx)
    }

    Function("isSupported") { () -> Bool in
      return WCSession.isSupported()
    }
  }
}

/// Kept off the Module class so the WCSessionDelegate conformance (with its
/// required activation callbacks) doesn't clutter the Expo module surface.
private class WatchSessionDelegate: NSObject, WCSessionDelegate {
  let onLog: ([String: Any]) -> Void
  init(onLog: @escaping ([String: Any]) -> Void) { self.onLog = onLog }

  func session(_ s: WCSession, activationDidCompleteWith st: WCSessionActivationState, error: Error?) {}
  func sessionDidBecomeInactive(_ s: WCSession) {}
  func sessionDidDeactivate(_ s: WCSession) { WCSession.default.activate() }
  func session(_ s: WCSession, didReceiveMessage m: [String: Any]) { onLog(m) }
  func session(_ s: WCSession, didReceiveApplicationContext c: [String: Any]) { onLog(c) }
}

#else

/// Mac Catalyst / platforms without WatchConnectivity: a no-op module so the
/// same JS API resolves everywhere without crashing.
public class WatchBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchBridgeModule")
    Events("onWatchLog")
    Function("push") { (_: String?) in }
    Function("isSupported") { () -> Bool in false }
  }
}

#endif
