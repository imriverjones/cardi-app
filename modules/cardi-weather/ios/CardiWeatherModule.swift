import CoreLocation
import ExpoModulesCore
import WeatherKit

/// Hourly forecast from Apple Weather, in the shape Cardi's engine uses.
public class CardiWeatherModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CardiWeather")

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
  }
}
