import CoreLocation
import ExpoModulesCore
import MapKit
import WeatherKit
import WidgetKit

/// The few things Cardi needs from iOS directly: Apple Weather, place search, and which widgets are on screen.
public class CardiNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CardiNative")

    /// Eight days of hours from local midnight today, plus the place's UTC offset.
    AsyncFunction("hourlyAsync") { (lat: Double, lon: Double) async throws -> [String: Any] in
      let location = CLLocation(latitude: lat, longitude: lon)

      // The place's own time zone, so "today" and "8am" mean the same as they do there.
      var timeZone = TimeZone.current
      if let tz = try? await CLGeocoder().reverseGeocodeLocation(location).first?.timeZone {
        timeZone = tz
      }
      var calendar = Calendar(identifier: .gregorian)
      calendar.timeZone = timeZone
      let now = Date()
      let midnight = calendar.startOfDay(for: now)
      let end = calendar.date(byAdding: .day, value: 8, to: midnight) ?? now.addingTimeInterval(8 * 86_400)

      let service = WeatherService.shared
      var hours: Forecast<HourWeather>
      do {
        hours = try await service.weather(for: location, including: .hourly(startDate: midnight, endDate: end))
      } catch {
        // Some hours before now may not be available; start from this hour instead.
        let thisHour = calendar.dateInterval(of: .hour, for: now)?.start ?? now
        hours = try await service.weather(for: location, including: .hourly(startDate: thisHour, endDate: end))
      }

      let rows: [[String: Any]] = hours.forecast.map { h in
        [
          "t": h.date.timeIntervalSince1970 * 1000,
          "temp": h.temperature.converted(to: .celsius).value,
          "feels": h.apparentTemperature.converted(to: .celsius).value,
          "dew": h.dewPoint.converted(to: .celsius).value,
          "rain": h.precipitationChance * 100,
          "uv": Double(h.uvIndex.value),
          "wind": h.wind.speed.converted(to: .kilometersPerHour).value,
          "condition": h.condition.rawValue,
        ]
      }
      return [
        "utcOffsetSeconds": Double(timeZone.secondsFromGMT(for: now)),
        "hours": rows,
      ]
    }

    /// Apple requires its Weather mark and a link to its data sources wherever the data is shown.
    AsyncFunction("attributionAsync") { () async throws -> [String: String] in
      let a = try await WeatherService.shared.attribution
      return [
        "legalPageURL": a.legalPageURL.absoluteString,
        "markLightURL": a.combinedMarkLightURL.absoluteString,
        "markDarkURL": a.combinedMarkDarkURL.absoluteString,
        "serviceName": a.serviceName,
      ]
    }

    /// City search with Apple Maps, so place names match the rest of iOS.
    AsyncFunction("searchPlacesAsync") { (query: String) async throws -> [[String: Any]] in
      let request = MKLocalSearch.Request()
      request.naturalLanguageQuery = query
      request.resultTypes = .address
      let response = try await MKLocalSearch(request: request).start()
      var seen = Set<String>()
      var out: [[String: Any]] = []
      for item in response.mapItems {
        let p = item.placemark
        let name = p.locality ?? item.name ?? p.name ?? query
        let detail = [p.administrativeArea, p.country].compactMap { $0 }.joined(separator: ", ")
        let key = "\(name)|\(detail)"
        if seen.contains(key) { continue }
        seen.insert(key)
        out.append([
          "name": name,
          "detail": detail,
          "lat": p.coordinate.latitude,
          "lon": p.coordinate.longitude,
        ])
      }
      return out
    }

    /// Which Cardi widgets are on the Home Screen, Lock Screen or StandBy right now, as "kind:family".
    AsyncFunction("widgetsAsync") { () async throws -> [String] in
      try await withCheckedThrowingContinuation { (cont: CheckedContinuation<[String], Error>) in
        WidgetCenter.shared.getCurrentConfigurations { result in
          switch result {
          case .success(let infos):
            cont.resume(returning: infos.map { "\($0.kind):\(String(describing: $0.family))" })
          case .failure(let error):
            cont.resume(throwing: error)
          }
        }
      }
    }
  }
}
