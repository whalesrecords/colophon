import WidgetKit
import SwiftUI

// Shared App Group — must match src/features/reading/widget-sync.ts + expo-target.config.js.
let APP_GROUP = "group.com.whalesrecords.colophon"

// Colophon palette.
extension Color {
  static let parchment = Color(red: 0.937, green: 0.902, blue: 0.827) // #EFE6D3
  static let card = Color(red: 0.984, green: 0.965, blue: 0.925)      // #FBF6EC
  static let ink = Color(red: 0.165, green: 0.118, blue: 0.082)       // #2A1E15
  static let brick = Color(red: 0.682, green: 0.255, blue: 0.200)     // #AE4133
  static let forest = Color(red: 0.176, green: 0.420, blue: 0.306)    // #2D6B4E
  static let track = Color(red: 0.894, green: 0.855, blue: 0.780)     // #E4DAC7
  static let muted = Color(red: 0.549, green: 0.518, blue: 0.475)     // #8C8479
}

struct ReadingEntry: TimelineEntry {
  let date: Date
  let streak: Int
  let today: Int
  let goal: Int
}

struct Provider: TimelineProvider {
  func read() -> ReadingEntry {
    let d = UserDefaults(suiteName: APP_GROUP)
    let goal = d?.integer(forKey: "goal") ?? 0
    return ReadingEntry(
      date: Date(),
      streak: d?.integer(forKey: "streak") ?? 0,
      today: d?.integer(forKey: "today") ?? 0,
      goal: goal == 0 ? 20 : goal
    )
  }
  func placeholder(in context: Context) -> ReadingEntry {
    ReadingEntry(date: Date(), streak: 3, today: 15, goal: 20)
  }
  func getSnapshot(in context: Context, completion: @escaping (ReadingEntry) -> Void) {
    completion(read())
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<ReadingEntry>) -> Void) {
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
    completion(Timeline(entries: [read()], policy: .after(next)))
  }
}

struct Ring: View {
  let pct: Double
  let color: Color
  var body: some View {
    ZStack {
      Circle().stroke(Color.track, lineWidth: 8)
      Circle()
        .trim(from: 0, to: max(0, min(1, pct)))
        .stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text("\(Int((min(1, pct)) * 100))%")
        .font(.system(size: 14, weight: .semibold))
        .foregroundColor(.ink)
    }
  }
}

struct ReadingWidgetView: View {
  var entry: ReadingEntry
  var pct: Double { entry.goal > 0 ? Double(entry.today) / Double(entry.goal) : 0 }
  var met: Bool { entry.today >= entry.goal }
  var body: some View {
    let accent = met ? Color.forest : Color.brick
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("OBJECTIF DU JOUR")
          .font(.system(size: 9, weight: .bold)).tracking(1)
          .foregroundColor(.muted)
        Spacer()
        if entry.streak > 0 {
          HStack(spacing: 3) {
            Image(systemName: "flame.fill").font(.system(size: 11)).foregroundColor(.brick)
            Text("\(entry.streak)").font(.system(size: 12, weight: .bold)).foregroundColor(.ink)
          }
        }
      }
      Spacer(minLength: 4)
      HStack(spacing: 12) {
        Ring(pct: pct, color: accent).frame(width: 56, height: 56)
        VStack(alignment: .leading, spacing: 2) {
          Text("\(entry.today) / \(entry.goal)")
            .font(.system(size: 20, weight: .semibold)).foregroundColor(.ink)
          Text(met ? "Objectif atteint" : "Encore \(max(0, entry.goal - entry.today)) p.")
            .font(.system(size: 11)).foregroundColor(met ? .forest : .muted)
        }
        Spacer()
      }
    }
    .padding(14)
    .containerBackground(for: .widget) { Color.parchment }
  }
}

struct ColophonReadingWidget: Widget {
  let kind = "ColophonReadingWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      ReadingWidgetView(entry: entry)
    }
    .configurationDisplayName("Ma série de lecture")
    .description("Ton objectif du jour et ta série.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// ===== Widget 2 : Mon année de lecture (stats) =====

struct StatsEntry: TimelineEntry {
  let date: Date
  let booksYear: Int
  let pagesYear: Int
  let collTotal: Int
}

struct StatsProvider: TimelineProvider {
  func read() -> StatsEntry {
    let d = UserDefaults(suiteName: APP_GROUP)
    return StatsEntry(
      date: Date(),
      booksYear: d?.integer(forKey: "booksYear") ?? 0,
      pagesYear: d?.integer(forKey: "pagesYear") ?? 0,
      collTotal: d?.integer(forKey: "collTotal") ?? 0
    )
  }
  func placeholder(in context: Context) -> StatsEntry {
    StatsEntry(date: Date(), booksYear: 42, pagesYear: 9120, collTotal: 192)
  }
  func getSnapshot(in context: Context, completion: @escaping (StatsEntry) -> Void) {
    completion(read())
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<StatsEntry>) -> Void) {
    let next = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date()
    completion(Timeline(entries: [read()], policy: .after(next)))
  }
}

struct StatMetric: View {
  let value: String
  let label: String
  let color: Color
  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(value).font(.system(size: 22, weight: .semibold)).foregroundColor(color)
      Text(label).font(.system(size: 10)).foregroundColor(.muted)
    }
  }
}

struct StatsWidgetView: View {
  var entry: StatsEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("MON ANNÉE DE LECTURE")
        .font(.system(size: 9, weight: .bold)).tracking(1)
        .foregroundColor(.muted)
      Spacer(minLength: 2)
      HStack(spacing: 18) {
        StatMetric(value: "\(entry.booksYear)", label: "livres", color: .brick)
        StatMetric(value: "\(entry.pagesYear)", label: "pages", color: .forest)
      }
      StatMetric(value: "\(entry.collTotal)", label: "dans la collection", color: .ink)
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(for: .widget) { Color.parchment }
  }
}

struct ColophonStatsWidget: Widget {
  let kind = "ColophonStatsWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StatsProvider()) { entry in
      StatsWidgetView(entry: entry)
    }
    .configurationDisplayName("Mon année de lecture")
    .description("Tes livres et pages lus cette année.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// ===== Widget 3 : Où en es-tu ? (current read + progress) =====

struct CurrentReadEntry: TimelineEntry {
  let date: Date
  let active: Bool
  let title: String
  let author: String
  let page: Int
  let total: Int
  let pct: Int
  let minutesToday: Int
}

struct CurrentReadProvider: TimelineProvider {
  func read() -> CurrentReadEntry {
    let d = UserDefaults(suiteName: APP_GROUP)
    return CurrentReadEntry(
      date: Date(),
      active: (d?.integer(forKey: "cr_active") ?? 0) == 1,
      title: d?.string(forKey: "cr_title") ?? "",
      author: d?.string(forKey: "cr_author") ?? "",
      page: d?.integer(forKey: "cr_page") ?? 0,
      total: d?.integer(forKey: "cr_total") ?? 0,
      pct: d?.integer(forKey: "cr_pct") ?? 0,
      minutesToday: d?.integer(forKey: "cr_minutesToday") ?? 0
    )
  }
  func placeholder(in context: Context) -> CurrentReadEntry {
    CurrentReadEntry(
      date: Date(), active: true, title: "L'Établi", author: "Robert Linhart",
      page: 84, total: 180, pct: 47, minutesToday: 25)
  }
  func getSnapshot(in context: Context, completion: @escaping (CurrentReadEntry) -> Void) {
    completion(read())
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<CurrentReadEntry>) -> Void) {
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
    completion(Timeline(entries: [read()], policy: .after(next)))
  }
}

struct CurrentReadView: View {
  var entry: CurrentReadEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 5) {
      Text("OÙ EN ES-TU ?")
        .font(.system(size: 9, weight: .bold)).tracking(1)
        .foregroundColor(.muted)

      if entry.active {
        Spacer(minLength: 2)
        Text(entry.title)
          .font(.system(size: 16, weight: .semibold)).foregroundColor(.ink)
          .lineLimit(2)
        if !entry.author.isEmpty {
          Text(entry.author)
            .font(.system(size: 11)).italic().foregroundColor(.muted).lineLimit(1)
        }
        Spacer(minLength: 4)
        GeometryReader { geo in
          ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 3).fill(Color.track).frame(height: 6)
            RoundedRectangle(cornerRadius: 3).fill(Color.brick)
              .frame(width: geo.size.width * CGFloat(min(100, max(0, entry.pct))) / 100, height: 6)
          }
        }.frame(height: 6)
        HStack {
          Text(entry.total > 0 ? "p. \(entry.page) / \(entry.total)" : "p. \(entry.page)")
            .font(.system(size: 11)).foregroundColor(.muted)
          Spacer()
          if entry.total > 0 {
            Text("\(entry.pct)%").font(.system(size: 12, weight: .bold)).foregroundColor(.brick)
          }
        }
        if entry.minutesToday > 0 {
          Text("\(entry.minutesToday) min aujourd'hui")
            .font(.system(size: 10)).foregroundColor(.muted)
        }
      } else {
        Spacer()
        Text("Aucune lecture en cours")
          .font(.system(size: 14, weight: .medium)).foregroundColor(.ink)
        Text("Ouvre un livre pour commencer")
          .font(.system(size: 11)).foregroundColor(.muted)
        Spacer()
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(for: .widget) { Color.parchment }
  }
}

struct ColophonCurrentReadWidget: Widget {
  let kind = "ColophonCurrentReadWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CurrentReadProvider()) { entry in
      CurrentReadView(entry: entry)
    }
    .configurationDisplayName("Où en es-tu ?")
    .description("Le livre que tu lis et ta progression.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct ColophonWidgets: WidgetBundle {
  var body: some Widget {
    ColophonReadingWidget()
    ColophonStatsWidget()
    ColophonCurrentReadWidget()
  }
}
