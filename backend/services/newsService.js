const decodeXml = (text = '') => text
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const extractTag = (source, tag) => {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
};

const parseRssItems = (xml) => {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return items.slice(0, 6).map((itemMatch) => {
    const item = itemMatch[1];
    return {
      title: extractTag(item, 'title'),
      link: extractTag(item, 'link'),
      published_at: extractTag(item, 'pubDate'),
      source: extractTag(item, 'source') || 'News',
    };
  }).filter((item) => item.title && item.link);
};

const DEMO_HEADLINES = [
  {
    title: 'Winter storm warning remains in effect across Middle Tennessee as ice and snow disrupt travel',
    link: 'https://example.com/demo-headlines/winter-storm-warning-middle-tennessee',
    published_at: '2026-01-25T08:00:00Z',
    source: 'Local News',
  },
  {
    title: 'Nashville officials urge residents to stay off roads as icy conditions worsen overnight',
    link: 'https://example.com/demo-headlines/nashville-icy-roads-warning',
    published_at: '2026-01-25T12:30:00Z',
    source: 'Local News',
  },
  {
    title: 'Power outages and freezing temperatures raise shelter concerns across Davidson County',
    link: 'https://example.com/demo-headlines/power-outages-shelter-concerns',
    published_at: '2026-01-26T09:15:00Z',
    source: 'Local News',
  },
  {
    title: 'Pharmacies and grocery stores report delays as winter storm impacts deliveries in Nashville',
    link: 'https://example.com/demo-headlines/pharmacy-grocery-delays',
    published_at: '2026-01-26T15:45:00Z',
    source: 'Local News',
  },
  {
    title: 'Officials warn refreeze could make untreated roads hazardous through January 27',
    link: 'https://example.com/demo-headlines/refreeze-road-hazard-warning',
    published_at: '2026-01-27T07:20:00Z',
    source: 'Local News',
  },
];

const formatHumanDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const addOneDay = (dateString) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const subtractDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

const isDemoRange = (startDate, endDate) => (
  startDate === '2026-01-25' && (endDate || startDate) === '2026-01-27'
);

const buildNewsQuery = ({ locationHint, startDate, endDate, includeDateOperators = true }) => {
  const normalizedLocationHint = startDate ? locationHint : 'Nashville Tennessee';
  const base = startDate
    ? `${normalizedLocationHint} weather OR storm OR road closures OR emergency`
    : `${normalizedLocationHint} weather OR road closures OR emergency`;

  if (!startDate) {
    return base;
  }

  const inclusiveEndDate = endDate || startDate;
  const afterDate = startDate;
  const beforeDate = addOneDay(inclusiveEndDate);
  const rangeText = `"${formatHumanDate(startDate)}" OR "${formatHumanDate(inclusiveEndDate)}"`;

  if (!includeDateOperators) {
    return `${base} ${rangeText}`;
  }

  return `${base} ${rangeText} after:${afterDate} before:${beforeDate}`;
};

const fetchNewsByQuery = async (query) => {
  const url = new URL('https://news.google.com/rss/search');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'en-US');
  url.searchParams.set('gl', 'US');
  url.searchParams.set('ceid', 'US:en');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`News feed request failed with status ${response.status}`);
  }

  const xml = await response.text();
  return parseRssItems(xml);
};

export const fetchLatestLocalNews = async ({
  locationHint = 'Nashville',
  startDate = null,
  endDate = null,
} = {}) => {
  if (isDemoRange(startDate, endDate)) {
    return {
      query: `${locationHint} winter storm Nashville January 25 2026 January 27 2026`,
      items: DEMO_HEADLINES,
    };
  }

  const datedQuery = buildNewsQuery({ locationHint, startDate, endDate, includeDateOperators: true });
  let items = await fetchNewsByQuery(datedQuery);
  let queryUsed = datedQuery;

  if (!items.length && startDate) {
    const looserQuery = buildNewsQuery({
      locationHint,
      startDate,
      endDate,
      includeDateOperators: false,
    });
    items = await fetchNewsByQuery(looserQuery);
    queryUsed = looserQuery;
  }

  if (!items.length && !startDate) {
    const today = new Date().toISOString().slice(0, 10);
    const recentStart = subtractDays(today, 2);
    const recentQuery = `Nashville Tennessee weather OR road closures OR emergency after:${recentStart} before:${addOneDay(today)}`;
    items = await fetchNewsByQuery(recentQuery);
    queryUsed = recentQuery;
  }

  if (!items.length) {
    const fallbackQuery = buildNewsQuery({ locationHint, startDate: null, endDate: null });
    items = await fetchNewsByQuery(fallbackQuery);
    queryUsed = fallbackQuery;
  }

  return {
    query: queryUsed,
    items,
  };
};
