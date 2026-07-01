import SwiftUI
import WatchConnectivity

// Shared App Group — matches the iOS app + widget. On the watch this is a *separate*
// on-device container (App Groups don't sync across devices), used only to cache the
// last snapshot the phone sent so the watch shows something while offline.
let APP_GROUP = "group.com.whalesrecords.colophon"

// Colophon palette (kept in sync with targets/widget/index.swift).
extension Color {
  static let parchment = Color(red: 0.937, green: 0.902, blue: 0.827) // #EFE6D3
  static let ink = Color(red: 0.165, green: 0.118, blue: 0.082)       // #2A1E15
  static let brick = Color(red: 0.682, green: 0.255, blue: 0.200)     // #AE4133
  static let forest = Color(red: 0.176, green: 0.420, blue: 0.306)    // #2D6B4E
  static let track = Color(red: 0.894, green: 0.855, blue: 0.780)     // #E4DAC7
  static let muted = Color(red: 0.549, green: 0.518, blue: 0.475)     // #8C8479
}

// ===== Shared state =====

struct ReadSnapshot {
  var active = false
  var title = ""
  var author = ""
  var page = 0
  var total = 0
  var pct = 0
  var minutesToday = 0
  var goal = 20
  var todayPages = 0
  var streak = 0
  /// id of the open reading_sessions row the phone sent; echoed back on every log
  /// so the phone can credit the right session in Supabase.
  var session = ""
}

/// Receives the current-read snapshot from the phone (WatchConnectivity application
/// context) and relays reading logs (chrono minutes, page bumps) back to it. The phone
/// side needs a matching WCSession handler to feed Supabase — see docs/watch.md.
final class WatchData: NSObject, ObservableObject, WCSessionDelegate {
  @Published var snap = ReadSnapshot()

  override init() {
    super.init()
    load()
    if WCSession.isSupported() {
      WCSession.default.delegate = self
      WCSession.default.activate()
    }
  }

  private var store: UserDefaults? { UserDefaults(suiteName: APP_GROUP) }

  private func load() {
    guard let d = store else { return }
    snap = ReadSnapshot(
      active: d.bool(forKey: "cr_active"),
      title: d.string(forKey: "cr_title") ?? "",
      author: d.string(forKey: "cr_author") ?? "",
      page: d.integer(forKey: "cr_page"),
      total: d.integer(forKey: "cr_total"),
      pct: d.integer(forKey: "cr_pct"),
      minutesToday: d.integer(forKey: "cr_minutesToday"),
      goal: max(1, d.integer(forKey: "goal")),
      todayPages: d.integer(forKey: "today"),
      streak: d.integer(forKey: "streak")
    )
  }

  private func apply(_ ctx: [String: Any]) {
    var s = snap
    if let v = ctx["cr_active"] as? Bool { s.active = v }
    if let v = ctx["cr_active"] as? Int { s.active = v == 1 }
    if let v = ctx["cr_title"] as? String { s.title = v }
    if let v = ctx["cr_author"] as? String { s.author = v }
    if let v = ctx["cr_page"] as? Int { s.page = v }
    if let v = ctx["cr_total"] as? Int { s.total = v }
    if let v = ctx["cr_pct"] as? Int { s.pct = v }
    if let v = ctx["cr_minutesToday"] as? Int { s.minutesToday = v }
    if let v = ctx["goal"] as? Int { s.goal = max(1, v) }
    if let v = ctx["today"] as? Int { s.todayPages = v }
    if let v = ctx["streak"] as? Int { s.streak = v }
    if let v = ctx["cr_session"] as? String { s.session = v }
    snap = s
    // Cache for offline display.
    if let d = store {
      d.set(s.active, forKey: "cr_active")
      d.set(s.title, forKey: "cr_title")
      d.set(s.author, forKey: "cr_author")
      d.set(s.page, forKey: "cr_page")
      d.set(s.total, forKey: "cr_total")
      d.set(s.pct, forKey: "cr_pct")
      d.set(s.minutesToday, forKey: "cr_minutesToday")
      d.set(s.goal, forKey: "goal")
      d.set(s.todayPages, forKey: "today")
      d.set(s.streak, forKey: "streak")
    }
  }

  /// Send a logged reading sitting (minutes) to the phone.
  func logMinutes(_ minutes: Int) {
    guard minutes > 0 else { return }
    send(["type": "minutes", "value": minutes])
    // Optimistic local update.
    snap.minutesToday += minutes
  }

  /// Send a page bump to the phone.
  func logPage(_ page: Int) {
    send(["type": "page", "value": max(0, page)])
    snap.page = max(0, page)
    if snap.total > 0 { snap.pct = min(100, Int(Double(snap.page) / Double(snap.total) * 100)) }
  }

  private func send(_ rawMessage: [String: Any]) {
    guard WCSession.default.activationState == .activated else { return }
    // Echo the session id so the phone credits the right reading_sessions row.
    var message = rawMessage
    if !snap.session.isEmpty { message["cr_session"] = snap.session }
    if WCSession.default.isReachable {
      WCSession.default.sendMessage(message, replyHandler: nil, errorHandler: nil)
    } else {
      // Queue for next sync if the phone isn't reachable right now.
      try? WCSession.default.updateApplicationContext(["pending": message])
    }
  }

  // WCSessionDelegate
  func session(
    _ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}
  func session(_ session: WCSession, didReceiveApplicationContext ctx: [String: Any]) {
    DispatchQueue.main.async { self.apply(ctx) }
  }
  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    DispatchQueue.main.async { self.apply(message) }
  }
}

// ===== Views =====

struct ProgressBar: View {
  let pct: Int
  let color: Color
  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(Color.track).frame(height: 6)
        Capsule().fill(color)
          .frame(width: geo.size.width * CGFloat(min(100, max(0, pct))) / 100, height: 6)
      }
    }.frame(height: 6)
  }
}

struct CurrentReadScreen: View {
  @ObservedObject var data: WatchData
  var body: some View {
    let s = data.snap
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Text("OÙ EN ES-TU ?")
          .font(.system(size: 9, weight: .bold)).tracking(1).foregroundColor(.muted)
        if s.active {
          Text(s.title).font(.system(size: 16, weight: .semibold)).foregroundColor(.ink)
            .lineLimit(3)
          if !s.author.isEmpty {
            Text(s.author).font(.system(size: 11)).italic().foregroundColor(.muted)
          }
          ProgressBar(pct: s.pct, color: .brick).padding(.top, 2)
          HStack {
            Text(s.total > 0 ? "p. \(s.page)/\(s.total)" : "p. \(s.page)")
              .font(.system(size: 12)).foregroundColor(.muted)
            Spacer()
            if s.total > 0 {
              Text("\(s.pct)%").font(.system(size: 13, weight: .bold)).foregroundColor(.brick)
            }
          }
          // Quick page bump.
          HStack(spacing: 8) {
            Button(action: { data.logPage(s.page - 1) }) {
              Image(systemName: "minus").frame(maxWidth: .infinity)
            }
            Button(action: { data.logPage(s.page + 1) }) {
              Image(systemName: "plus").frame(maxWidth: .infinity)
            }
          }
          .buttonStyle(.bordered).tint(.brick).padding(.top, 2)
        } else {
          Text("Aucune lecture en cours").font(.system(size: 14)).foregroundColor(.ink)
          Text("Ouvre un livre sur ton iPhone").font(.system(size: 11)).foregroundColor(.muted)
        }
        if s.minutesToday > 0 {
          Text("\(s.minutesToday) min lues aujourd'hui")
            .font(.system(size: 11)).foregroundColor(.forest).padding(.top, 4)
        }
      }
      .padding(.horizontal, 4)
    }
  }
}

struct ChronoScreen: View {
  @ObservedObject var data: WatchData
  @State private var running = false
  @State private var baseSeconds = 0
  @State private var startedAt: Date?
  @State private var now = Date()

  private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

  private var elapsed: Int {
    if running, let s = startedAt { return baseSeconds + Int(now.timeIntervalSince(s)) }
    return baseSeconds
  }
  private var credit: Int { Int((Double(elapsed) / 60.0).rounded()) }

  private func clock(_ total: Int) -> String {
    let m = total / 60, s = total % 60
    return String(format: "%02d:%02d", m, s)
  }

  var body: some View {
    VStack(spacing: 10) {
      Text("CHRONO").font(.system(size: 9, weight: .bold)).tracking(1).foregroundColor(.muted)
      Text(clock(elapsed))
        .font(.system(size: 40, weight: .semibold, design: .rounded))
        .foregroundColor(running ? .brick : .ink)
        .monospacedDigit()
      if !running && elapsed == 0 {
        Button(action: { startedAt = Date(); now = Date(); running = true }) {
          Text("Démarrer").frame(maxWidth: .infinity)
        }.buttonStyle(.borderedProminent).tint(.brick)
      } else {
        HStack(spacing: 8) {
          Button(action: {
            if running { baseSeconds = elapsed; startedAt = nil; running = false }
            else { startedAt = Date(); now = Date(); running = true }
          }) {
            Text(running ? "Pause" : "Reprendre").frame(maxWidth: .infinity)
          }.buttonStyle(.bordered).tint(.muted)
          Button(action: {
            if credit >= 1 { data.logMinutes(credit) }
            running = false; startedAt = nil; baseSeconds = 0
          }) {
            Text(credit >= 1 ? "Fin · +\(credit)′" : "Fin").frame(maxWidth: .infinity)
          }.buttonStyle(.borderedProminent).tint(.brick)
        }
      }
    }
    .padding(.horizontal, 4)
    .onReceive(ticker) { t in if running { now = t } }
  }
}

struct ContentView: View {
  @StateObject private var data = WatchData()
  var body: some View {
    TabView {
      CurrentReadScreen(data: data)
      ChronoScreen(data: data)
    }
    .tabViewStyle(.page)
  }
}

@main
struct ColophonWatchApp: App {
  var body: some Scene {
    WindowGroup { ContentView() }
  }
}
