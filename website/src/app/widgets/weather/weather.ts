import { Component, inject } from '@angular/core';
import { Weather } from '../../services/weather';

const WMO: Readonly<Record<number, string>> = {
  0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain', 71: 'light snow', 73: 'snow',
  75: 'heavy snow', 80: 'showers', 95: 'thunderstorm',
};

// It is called WeatherPanel and not Weather, since that name already belongs to the service
@Component({
  selector: 'app-weather',
  imports: [],
  templateUrl: './weather.html',
})
export class WeatherPanel {
  protected readonly weather = inject(Weather);

  protected describe(code: number): string {
    return WMO[code] ?? `wmo ${code}`;
  }
}
