import { Op } from 'sequelize';
import Blockage from '../models/Blockage.js';
import { fetchLatestLocalNews } from './newsService.js';
import { getWeatherSummary } from './weatherService.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const buildSystemPrompt = (isHistorical = false) => `
You summarize local conditions for a mutual-aid dashboard.
Return valid JSON only. No markdown.
Use only the provided weather window, blockages, and headlines — do not invent facts.
${isHistorical
  ? 'You are summarizing a HISTORICAL weather event. Reference the storm, weather event, or crisis conditions described in the provided context.'
  : 'You are summarizing CURRENT conditions right now. Do NOT mention historical storms, past winter events, or any storm/winter storm language unless those exact words appear in the provided current headlines or current weather risk tags. If the current weather is clear or mild, describe it as such.'
}
Do not infer a city-wide storm from a single blockage.
Keep the title grounded in the supplied context.
JSON schema:
{
  "summary_title": "string",
  "summary_text": "string",
  "key_points": ["string", "string", "string"],
  "recommended_watchouts": ["string"],
  "weather_summary": "string",
  "blockage_summary": "string"
}
`.trim();

const buildUserPrompt = (context) => JSON.stringify({
  task: 'Summarize the latest local crisis context for dashboard users.',
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

const headlineText = (headlines = []) => headlines
  .map((headline) => `${headline.title || ''} ${headline.source || ''}`)
  .join(' ')
  .toLowerCase();

const hasStormEvidence = (context) => {
  const tags = context.weather_window?.impact_summary?.risk_tags || [];
  const weatherSummary = `${context.weather_window?.display_summary || ''} ${context.weather?.summary || ''}`.toLowerCase();
  const headlines = headlineText(context.headlines);

  if (
    tags.includes('ice_risk') ||
    tags.includes('snow_impact_risk') ||
    tags.includes('heavy_precipitation_risk')
  ) {
    return true;
  }

  if (/(snow|winter storm|ice storm|storm warning|storm watch|blizzard|freezing rain)/.test(weatherSummary)) {
    return true;
  }

  return /(winter storm|ice storm|storm warning|storm watch|blizzard|snow emergency|freezing rain)/.test(headlines);
};

const stripStormLanguage = (text = '') => text
  .replace(/\bwinter storm alert\b/gi, 'Local Conditions Update')
  .replace(/\bwinter storm warning\b/gi, 'weather advisory')
  .replace(/\bice storm\b/gi, 'weather conditions')
  .replace(/\bwinter storm\b/gi, 'weather conditions')
  .replace(/\bstorm warning\b/gi, 'weather advisory')
  .replace(/\bstorm watch\b/gi, 'weather watch');

const sanitizeSummary = (summary, context) => {
  if (hasStormEvidence(context)) {
    return summary;
  }

  return {
    ...summary,
    summary_title: stripStormLanguage(summary.summary_title || 'Local Conditions Update'),
    summary_text: stripStormLanguage(summary.summary_text || ''),
    key_points: (summary.key_points || []).map((point) => stripStormLanguage(point)),
    recommended_watchouts: (summary.recommended_watchouts || []).map((point) => stripStormLanguage(point)),
  };
};

const buildBlockageSummary = (blockages) => {
  if (!blockages.length) {
    return 'No active blockages were reported recently.';
  }

  const severityCounts = blockages.reduce((acc, blockage) => {
    acc[blockage.severity] = (acc[blockage.severity] || 0) + 1;
    return acc;
  }, {});

  const severityText = Object.entries(severityCounts)
    .map(([severity, count]) => `${count} ${severity}`)
    .join(', ');

  return `${blockages.length} active reported blockages (${severityText}).`;
};

export const buildNewsSummaryContext = async ({
  user,
  weatherMode,
  historicalDate,
  startDate,
  endDate,
}) => {
  const lat = parseFloat(user.location_lat || 36.1447);
  const lng = parseFloat(user.location_lng || -86.8027);
  const locationHint = user.location_address?.split(',')[0]?.trim() || 'Nashville';

  const [weather, blockages, newsResult] = await Promise.all([
    getWeatherSummary({
      lat,
      lng,
      mode: weatherMode,
      historicalDate,
      startDate,
      endDate,
    }),
    Blockage.findAll({
      where: {
        status: {
          [Op.in]: ['reported', 'verified', 'active'],
        },
      },
      order: [['created_at', 'DESC']],
      limit: 8,
    }),
    fetchLatestLocalNews({
      locationHint,
      startDate: weatherMode === 'historical_range' ? (startDate || historicalDate || null) : null,
      endDate: weatherMode === 'historical_range' ? (endDate || startDate || historicalDate || null) : null,
    }),
  ]);

  const normalizedBlockages = blockages.map((blockage) => ({
    blockage_type: blockage.blockage_type,
    severity: blockage.severity,
    location_address: blockage.location_address || 'Unknown location',
    created_at: blockage.created_at,
  }));

  return {
    weather,
    weather_window: {
      mode: weather.mode,
      start_date: weather.date_range?.start_date || null,
      end_date: weather.date_range?.end_date || null,
      display_summary: weather.display_summary || weather.summary,
      impact_summary: weather.impact_summary || null,
    },
    blockages: normalizedBlockages,
    blockage_summary: buildBlockageSummary(normalizedBlockages),
    headlines: newsResult.items,
    news_query: newsResult.query,
    location_hint: locationHint,
  };
};

export const generateNewsSummary = async (context) => {
  const isHistorical = context.weather_window?.mode === 'historical_range';
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: `${buildSystemPrompt(isHistorical)}\n\n${buildUserPrompt(context)}`,
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = await response.json();
  const parsed = parseJsonResponse(data.response || '');
  const rawSummary = {
    summary_title: parsed.summary_title || 'AI Local Conditions Summary',
    summary_text: parsed.summary_text || '',
    key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
    recommended_watchouts: Array.isArray(parsed.recommended_watchouts) ? parsed.recommended_watchouts : [],
    weather_summary: parsed.weather_summary || context.weather_window.display_summary || '',
    blockage_summary: parsed.blockage_summary || context.blockage_summary,
  };

  return sanitizeSummary(rawSummary, context);
};
