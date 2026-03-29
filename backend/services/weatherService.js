const WEATHER_MODES = {
  CURRENT: 'current',
  HISTORICAL: 'historical',
  HISTORICAL_RANGE: 'historical_range',
  FORECAST_RANGE: 'forecast_range',
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

const formatNumber = (value) => (
  value == null || Number.isNaN(value) ? null : Number(value.toFixed(1))
);

const average = (values) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : null;

const maxValue = (values) => values.length ? Math.max(...values) : null;
const minValue = (values) => values.length ? Math.min(...values) : null;
const sumValues = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) : null;

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const resolveMode = (requestedMode) => {
  if (
    requestedMode === WEATHER_MODES.CURRENT ||
    requestedMode === WEATHER_MODES.HISTORICAL ||
    requestedMode === WEATHER_MODES.HISTORICAL_RANGE ||
    requestedMode === WEATHER_MODES.FORECAST_RANGE
  ) {
    return requestedMode === WEATHER_MODES.HISTORICAL
      ? WEATHER_MODES.HISTORICAL_RANGE
      : requestedMode;
  }

  const envMode = process.env.WEATHER_DATA_MODE;
  if (
    envMode === WEATHER_MODES.CURRENT ||
    envMode === WEATHER_MODES.HISTORICAL ||
    envMode === WEATHER_MODES.HISTORICAL_RANGE ||
    envMode === WEATHER_MODES.FORECAST_RANGE
  ) {
    return envMode === WEATHER_MODES.HISTORICAL
      ? WEATHER_MODES.HISTORICAL_RANGE
      : envMode;
  }

  return WEATHER_MODES.CURRENT;
};

const normalizeCurrentWeather = (payload) => {
  const current = payload.current || {};
  const observedAt = current.time || null;
  const temperature = current.temperature_2m ?? null;
  const windSpeed = current.wind_speed_10m ?? null;
  const precipitation = current.precipitation ?? null;
  const weatherCode = current.weather_code ?? null;
  const riskTags = [
    ...(temperature != null && temperature <= 0 ? ['freezing_risk'] : []),
    ...(precipitation != null && precipitation >= 10 ? ['heavy_precipitation_risk'] : []),
    ...(windSpeed != null && windSpeed >= 35 ? ['high_wind_risk'] : []),
  ];

  return {
    mode: WEATHER_MODES.CURRENT,
    observed_at: observedAt,
    date_range: {
      start_date: observedAt ? toIsoDate(observedAt) : null,
      end_date: observedAt ? toIsoDate(observedAt) : null,
    },
    temperature_c: temperature,
    wind_speed_kmh: windSpeed,
    precipitation_mm: precipitation,
    weather_code: weatherCode,
    summary: WEATHER_CODE_LABELS[weatherCode] || 'Unknown conditions',
    impact_summary: {
      dominant_condition: WEATHER_CODE_LABELS[weatherCode] || 'Unknown conditions',
      avg_temperature_c: formatNumber(temperature),
      min_temperature_c: formatNumber(temperature),
      max_temperature_c: formatNumber(temperature),
      total_precipitation_mm: formatNumber(precipitation),
      total_snowfall_cm: 0,
      max_wind_speed_kmh: formatNumber(windSpeed),
      risk_tags: riskTags,
    },
    display_summary: `${WEATHER_CODE_LABELS[weatherCode] || 'Unknown conditions'} | ${formatNumber(temperature)} C | precipitation ${formatNumber(precipitation) ?? 0} mm | wind ${formatNumber(windSpeed) ?? 0} km/h`,
  };
};

const normalizeRangeWeather = (payload, mode, startDate, endDate) => {
  const hourly = payload.hourly || {};
  const temperatures = hourly.temperature_2m || [];
  const precipitation = hourly.precipitation || [];
  const snowfall = hourly.snowfall || [];
  const windSpeeds = hourly.wind_speed_10m || [];
  const weatherCodes = hourly.weather_code || [];
  const dominantCode = weatherCodes.length ? weatherCodes[Math.floor(weatherCodes.length / 2)] : null;
  const totalPrecipitation = sumValues(precipitation);
  const totalSnowfall = sumValues(snowfall);
  const avgTemperature = average(temperatures);
  const maxWindSpeed = maxValue(windSpeeds);
  const minTemperature = minValue(temperatures);
  const maxTemperature = maxValue(temperatures);
  const riskTags = [
    ...(minTemperature != null && minTemperature <= 0 ? ['freezing_risk'] : []),
    ...(totalPrecipitation != null && totalPrecipitation >= 15 ? ['heavy_precipitation_risk'] : []),
    ...(maxWindSpeed != null && maxWindSpeed >= 35 ? ['high_wind_risk'] : []),
    ...(totalSnowfall != null && totalSnowfall >= 1 ? ['snow_impact_risk'] : []),
    ...(minTemperature != null && minTemperature <= 0 && totalPrecipitation != null && totalPrecipitation >= 5 ? ['ice_risk'] : []),
  ];

  return {
    mode,
    observed_at: startDate,
    date_range: {
      start_date: startDate,
      end_date: endDate,
    },
    temperature_c: avgTemperature,
    wind_speed_kmh: average(windSpeeds),
    precipitation_mm: totalPrecipitation,
    snowfall_cm: totalSnowfall,
    max_precipitation_mm: maxValue(precipitation),
    weather_code: dominantCode,
    summary: WEATHER_CODE_LABELS[dominantCode] || 'Weather range snapshot',
    impact_summary: {
      dominant_condition: WEATHER_CODE_LABELS[dominantCode] || 'Weather range snapshot',
      avg_temperature_c: formatNumber(avgTemperature),
      min_temperature_c: formatNumber(minTemperature),
      max_temperature_c: formatNumber(maxTemperature),
      total_precipitation_mm: formatNumber(totalPrecipitation),
      total_snowfall_cm: formatNumber(totalSnowfall),
      max_precipitation_mm: formatNumber(maxValue(precipitation)),
      max_wind_speed_kmh: formatNumber(maxWindSpeed),
      risk_tags: riskTags,
    },
    display_summary: `${WEATHER_CODE_LABELS[dominantCode] || 'Weather range snapshot'} | min ${formatNumber(minTemperature)} C | max ${formatNumber(maxTemperature)} C | precipitation ${formatNumber(totalPrecipitation) ?? 0} mm | snowfall ${formatNumber(totalSnowfall) ?? 0} cm | max wind ${formatNumber(maxWindSpeed) ?? 0} km/h`,
  };
};

const resolveDateRange = ({ mode, requestedStartDate, requestedEndDate, historicalDate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const defaultHistoricalDate = process.env.DEFAULT_HISTORICAL_WEATHER_DATE || today;

  if (mode === WEATHER_MODES.HISTORICAL_RANGE) {
    const startDate = requestedStartDate || historicalDate || defaultHistoricalDate;
    const endDate = requestedEndDate || startDate;
    return { startDate, endDate };
  }

  if (mode === WEATHER_MODES.FORECAST_RANGE) {
    const startDate = requestedStartDate || today;
    const endDate = requestedEndDate || addDays(startDate, 2);
    return { startDate, endDate };
  }

  return { startDate: null, endDate: null };
};

export const getWeatherSummary = async ({
  lat,
  lng,
  mode: requestedMode,
  historicalDate,
  startDate: requestedStartDate,
  endDate: requestedEndDate,
}) => {
  const mode = resolveMode(requestedMode);
  const { startDate, endDate } = resolveDateRange({
    mode,
    requestedStartDate,
    requestedEndDate,
    historicalDate,
  });

  if (mode === WEATHER_MODES.HISTORICAL_RANGE) {
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lng);
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);
    url.searchParams.set('hourly', 'temperature_2m,precipitation,snowfall,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Historical weather request failed with status ${response.status}`);
    }

    const data = await response.json();
    return normalizeRangeWeather(data, WEATHER_MODES.HISTORICAL_RANGE, startDate, endDate);
  }

  if (mode === WEATHER_MODES.FORECAST_RANGE) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lng);
    url.searchParams.set('hourly', 'temperature_2m,precipitation,snowfall,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Forecast weather request failed with status ${response.status}`);
    }

    const data = await response.json();
    return normalizeRangeWeather(data, WEATHER_MODES.FORECAST_RANGE, startDate, endDate);
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
