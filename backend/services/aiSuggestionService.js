import Offer from '../models/Offer.js';
import OfferItem from '../models/OfferItem.js';
import Request from '../models/Request.js';
import RequestItem from '../models/RequestItem.js';
import { getNearbyBlockages, getNearbyPlaces, summarizeNearbyPlaces } from './locationContextService.js';
import { getWeatherSummary } from './weatherService.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const AI_BLOCKAGE_RADIUS_KM = 4.82802; // 3 miles
const URGENCY_ORDER = ['low', 'medium', 'high', 'critical'];

const summarizeHistory = (records, itemKey) => (
  records.slice(0, 5).map((record) => ({
    title: record.title,
    description: record.description || '',
    items: (record[itemKey] || []).map((item) => item.resource_type),
    location_address: record.location_address || '',
    created_at: record.created_at,
  }))
);

const buildSystemPrompt = (mode) => `
You are generating practical ${mode === 'offer' ? 'offer' : 'request'} suggestions for a crisis mutual-aid application.
Return valid JSON only. No markdown.
Be concrete, realistic, and concise.
Use the provided context: user history, nearby conditions, weather window, blockages, and nearby places.
If the weather context is forward-looking, make proactive suggestions.
Only describe weather conditions that are actually present in the context data values. Do not invent or assume weather conditions that are not reflected in the data.
Never invent unsafe claims.
JSON schema:
{
  "suggested_title": "string",
  "suggested_description": "string",
  "suggested_items": ["string", "string"],
  "suggested_urgency": "low|medium|high|critical|null",
  "reasoning_summary": "string",
  "safety_notes": ["string"]
}
`.trim();

const buildUserPrompt = ({ mode, context }) => JSON.stringify({
  task: mode === 'offer'
    ? 'Generate one suggested offer the user could realistically post now.'
    : 'Generate one suggested request the user could realistically post now.',
  context,
});

const parseJsonResponse = (text) => {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain valid JSON.');
  }

  return JSON.parse(trimmed.slice(start, end + 1));
};

const getMinimumUrgency = (context) => {
  const tags = context.weather?.impact_summary?.risk_tags || [];
  const blockages = context.nearby_blockages || [];

  if (tags.includes('ice_risk') || blockages.length >= 5) {
    return 'high';
  }

  if (
    tags.includes('freezing_risk') ||
    tags.includes('snow_impact_risk') ||
    tags.includes('heavy_precipitation_risk') ||
    tags.includes('high_wind_risk') ||
    blockages.length >= 2
  ) {
    return 'medium';
  }

  return 'low';
};

const coerceUrgency = (suggestedUrgency, minimumUrgency) => {
  const normalizedSuggested = URGENCY_ORDER.includes(suggestedUrgency) ? suggestedUrgency : 'medium';
  const normalizedMinimum = URGENCY_ORDER.includes(minimumUrgency) ? minimumUrgency : 'low';

  return URGENCY_ORDER.indexOf(normalizedSuggested) >= URGENCY_ORDER.indexOf(normalizedMinimum)
    ? normalizedSuggested
    : normalizedMinimum;
};

export const buildSuggestionContext = async ({
  user,
  mode,
  weatherMode,
  historicalDate,
  startDate,
  endDate,
}) => {
  const lat = parseFloat(user.location_lat || 36.1447);
  const lng = parseFloat(user.location_lng || -86.8027);

  const [offers, requests, weather, nearbyBlockages, nearbyPlaces] = await Promise.all([
    Offer.findAll({
      where: { user_id: user.user_id },
      include: [{ model: OfferItem, as: 'items' }],
      order: [['created_at', 'DESC']],
    }),
    Request.findAll({
      where: { user_id: user.user_id },
      include: [{ model: RequestItem, as: 'items' }],
      order: [['created_at', 'DESC']],
    }),
    getWeatherSummary({
      lat,
      lng,
      mode: weatherMode,
      historicalDate,
      startDate,
      endDate,
    }),
    getNearbyBlockages({ lat, lng, radiusKm: AI_BLOCKAGE_RADIUS_KM }),
    getNearbyPlaces({ lat, lng }),
  ]);

  return {
    mode,
    user: {
      name: user.name,
      gender: user.gender,
      user_type: user.user_type,
      location_address: user.location_address,
      lat,
      lng,
    },
    weather,
    weather_window: {
      mode: weather.mode,
      start_date: weather.date_range?.start_date || null,
      end_date: weather.date_range?.end_date || null,
      summary: weather.summary,
      impact_summary: weather.impact_summary || null,
    },
    nearby_blockages: nearbyBlockages.map((blockage) => ({
      blockage_type: blockage.blockage_type,
      severity: blockage.severity,
      location_address: blockage.location_address,
      distance_km: Number(blockage.distance_km.toFixed(2)),
    })),
    nearby_places: summarizeNearbyPlaces(nearbyPlaces),
    recent_offers: summarizeHistory(offers.map((offer) => offer.toJSON()), 'items'),
    recent_requests: summarizeHistory(requests.map((request) => request.toJSON()), 'items'),
  };
};

export const generateSuggestion = async ({ mode, context }) => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: `${buildSystemPrompt(mode)}\n\n${buildUserPrompt({ mode, context })}`,
      stream: false,
      options: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = await response.json();
  const parsed = parseJsonResponse(data.response || '');
  const minimumUrgency = getMinimumUrgency(context);

  return {
    suggested_title: parsed.suggested_title || '',
    suggested_description: parsed.suggested_description || '',
    suggested_items: Array.isArray(parsed.suggested_items) ? parsed.suggested_items : [],
    suggested_urgency: coerceUrgency(parsed.suggested_urgency || null, minimumUrgency),
    reasoning_summary: parsed.reasoning_summary || '',
    safety_notes: Array.isArray(parsed.safety_notes) ? parsed.safety_notes : [],
  };
};
