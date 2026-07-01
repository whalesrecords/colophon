import ExpoModulesCore

/**
 * Phone-side Apple Watch bridge — NO-OP STUB.
 *
 * The real implementation activates a `WCSession`, pushes the App-Group `cr_*`
 * snapshot to the watch, and forwards the watch's minute/page logs to JS as an
 * `onWatchLog` event. That version is kept verbatim in `docs/watch.md`: it needs
 * the WatchConnectivity framework wired into this module's build AND a paired
 * Apple Watch to validate — neither of which a headless/CI build can exercise,
 * and `import WatchConnectivity` inside an Expo module's static-framework compile
 * doesn't resolve `WCSession` without extra build-settings surgery.
 *
 * So this stub ships the same JS-facing API (so `watch-bridge.ts` resolves and
 * no-ops everywhere), and the real WCSession code is restored when the watch app
 * target is activated on a Mac with a device. The JS layer guards every call with
 * `native?.`, so an inert module changes nothing on phone/web/Android.
 */
public class WatchBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchBridgeModule")
    Events("onWatchLog")
    Function("push") { (_: String?) in }
    Function("isSupported") { () -> Bool in false }
  }
}
