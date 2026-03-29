const WEATHER_MODES = {
  CURRENT: 'current',
  HISTORICAL: 'historical',
};

const WEATHER_CODE_LABELS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

const resolveMode = (requestedMode) => {
  if (requestedMode === WEATHER_MODES.CURRENT || requestedMode === WEATHER_MODES.HISTORICAL) {
    return requestedMode;
  }

  const envMode = process.env.WEATHER_DATA_MODE;
  if (envMode === WEATHER_MODES.HISTORICAL || envMode === WEATHER_MODES.CURRENT) {
    return envMode;
  }

  return WEATHER_MODES.CURRENT;
};

const getHistoricalDate = (requestedDate) => {
  if (requestedDate) {
    return requestedDate;
  }

  if (process.env.DEFAULT_HISTORICAL_WEATHER_DATE) {
    return process.env.DEFAULT_HISTORICAL_WEATHER_DATE;
  }

  return new Date().toISOString().slice(0, 10);
};

const normalizeCurrentWeather = (payload) => {
  const current = payload.current || {};

  return {
    mode: WEATHER_MODES.CURRENT,
    observed_at: current.time || null,
    temperature_c: current.temperature_2m ?? null,
    wind_speed_kmh: current.wind_speed_10m ?? null,
    precipitation_mm: current.precipitation ?? null,
    weather_code: current.weather_code ?? null,
    summary: WEATHER_CODE_LABELS[current.weather_code] || 'Unknown conditions',
  };
};

const normalizeHistoricalWeather = (payload, date) => {
  const hourly = payload.hourly || {};
  const temperatures = hourly.temperature_2m || [];
  const precipitation = hourly.precipitation || [];
  const windSpeeds = hourly.wind_speed_10m || [];
  const weatherCodes = hourly.weather_code || [];

  const average = (values) => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

  const maxValue = (values) => values.length ? Math.max(...values) : null;
  const dominantCode = weatherCodes.length ? weatherCodes[Math.floor(weatherCodes.length / 2)] : null;

  return {
    mode: WEATHER_MODES.HISTORICAL,
    observed_at: date,
    temperature_c: average(temperatures),
    wind_speed_kmh: average(windSpeeds),
    precipitation_mm: precipitation.length ? precipitation.reduce((sum, value) => sum + value, 0) : null,
    max_precipitation_mm: maxValue(precipitation),
    weather_code: dominantCode,
    summary: WEATHER_CODE_LABELS[dominantCode] || 'Historical weather snapshot',
  };
};

export const getWeatherSummary = async ({ lat, lng, mode: requestedMode, historicalDate }) => {
  const mode = resolveMode(requestedMode);

  if (mode === WEATHER_MODES.HISTORICAL) {
    const date = getHistoricalDate(historicalDate);
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lng);
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);
    url.searchParams.set('hourly', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Historical weather request failed with status ${response.status}`);
    }

    const data = await response.json();
    return normalizeHistoricalWeather(data, date);
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lng);
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Current weather request failed with status ${response.status}`);
  }

  const data = await response.json();
  return normalizeCurrentWeather(data);
};

export { WEATHER_MODES };
