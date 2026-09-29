/**
 * URL Parameter Filter & Tracking Sanitizer Utility
 * 
 * Provides robust validation and extraction of valid car search/filter parameters
 * while strictly discarding all marketing tracking parameters (fbclid, igshid, gclid, utm_*, etc.).
 * 
 * Prevents marketing ad clicks from polluting car search queries and causing 0-result empty states.
 */

// Blacklist of known ad/marketing tracking parameters across Meta, Google, TikTok, Twitter/X, Microsoft, etc.
export const MARKETING_TRACKING_KEYS = new Set([
  'fbclid',
  'igshid',
  'gclid',
  'wbraid',
  'gbraid',
  'dclid',
  'gclsrc',
  'ttclid',
  'msclkid',
  'twclid',
  'li_fat_id',
  'mc_eid',
  'mc_cid',
  '_ga',
  '_gl',
  '_hsenc',
  '_hsmi',
  'yclid',
  'fbadid',
  'fb_action_ids',
  'fb_action_types',
  'fb_source',
  'epik',
  'sccid',
  'ref',
  'ad_id',
  'adset_id',
  'campaign_id'
]);

/**
 * Checks whether a given query parameter key is a marketing/tracking parameter.
 * Matches exact blacklist entries as well as any key with `utm_` prefix (case-insensitive).
 */
export function isMarketingTrackingParam(key) {
  if (!key || typeof key !== 'string') return false;
  const lower = key.toLowerCase().trim();
  if (MARKETING_TRACKING_KEYS.has(lower)) return true;
  if (lower.startsWith('utm_') || lower.startsWith('utm-')) return true;
  return false;
}

// Whitelist of valid car filter keys accepted by the application
export const VALID_CAR_FILTER_KEYS = new Set([
  'search',
  'q',
  'keyword',
  'make',
  'brand',
  'model',
  'category',
  'year',
  'minyear',
  'min_year',
  'maxyear',
  'max_year',
  'zone',
  'location',
  'city',
  'drivermode',
  'driver_mode',
  'driver',
  'minprice',
  'min_price',
  'maxprice',
  'max_price',
  'sortby',
  'sort',
  'order',
  'transmission',
  'fuel',
  'fuel_type',
  'seats',
  'usage_type',
  'view',
  'viewmode',
  'view_mode'
]);

/**
 * Checks whether a given query parameter key is an allowed car filter key.
 */
export function isValidCarFilterKey(key) {
  if (!key || typeof key !== 'string') return false;
  const lower = key.toLowerCase().trim();
  if (isMarketingTrackingParam(lower)) return false;
  return VALID_CAR_FILTER_KEYS.has(lower);
}

/**
 * Normalizes a category string to standard title case (e.g. 'economy' -> 'Economy', 'suv' -> 'SUV').
 */
export function normalizeCategory(val) {
  if (!val) return 'all';
  const lower = String(val).toLowerCase().trim();
  if (lower === 'all') return 'all';
  if (lower === 'economy') return 'Economy';
  if (lower === 'suv' || lower === 'suv & 4x4' || lower === 'suvs') return 'SUV';
  if (lower === 'luxury') return 'Luxury';
  if (lower === 'van' || lower === 'vans') return 'Van';
  return val.trim();
}

/**
 * Normalizes a driver mode string.
 */
export function normalizeDriverMode(val) {
  if (!val) return 'all';
  const lower = String(val).toLowerCase().trim();
  if (lower === 'all') return 'all';
  if (lower === 'self-drive' || lower === 'self' || lower === 'selfdrive') return 'Self-Drive';
  if (lower === 'with driver' || lower === 'chauffeur' || lower === 'with-driver') return 'With Driver';
  if (lower === 'both') return 'Both';
  return val.trim();
}

/**
 * Normalizes a zone / location string.
 */
export function normalizeZone(val) {
  if (!val) return 'all';
  const lower = String(val).toLowerCase().trim();
  if (lower === 'all') return 'all';
  if (lower === 'bole') return 'Bole';
  if (lower === 'sarbet') return 'Sarbet';
  if (lower === 'cmc') return 'CMC';
  if (lower === 'kazanchis') return 'Kazanchis';
  return val.trim();
}

/**
 * Extracts and sanitizes URL search parameters into a clean filter object.
 *
 * @param {string | URLSearchParams | Record<string, any>} searchSource - The search query string, URLSearchParams instance, or plain object.
 * @returns {{
 *   search: string,
 *   make: string,
 *   model: string,
 *   category: string,
 *   year: string,
 *   zone: string,
 *   driverMode: string,
 *   minPrice: string,
 *   maxPrice: string,
 *   sortBy: string,
 *   viewMode: string,
 *   hasActiveFilters: boolean,
 *   ignoredTrackingParams: string[]
 * }}
 */
export function parseUrlFilters(searchSource) {
  const result = {
    search: '',
    make: '',
    model: '',
    category: 'all',
    year: '',
    zone: 'all',
    driverMode: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    viewMode: 'explore',
    hasActiveFilters: false,
    ignoredTrackingParams: []
  };

  if (!searchSource) return result;

  const entries = [];

  try {
    if (typeof searchSource === 'string') {
      let queryString = searchSource;
      if (queryString.includes('?')) {
        queryString = queryString.split('?')[1] || '';
      }
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        entries.push([key, value]);
      });
    } else if (typeof URLSearchParams !== 'undefined' && searchSource instanceof URLSearchParams) {
      searchSource.forEach((value, key) => {
        entries.push([key, value]);
      });
    } else if (typeof searchSource === 'object' && searchSource !== null) {
      for (const [k, v] of Object.entries(searchSource)) {
        if (Array.isArray(v)) {
          v.forEach(val => entries.push([k, String(val)]));
        } else if (v !== undefined && v !== null) {
          entries.push([k, String(v)]);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse URL search params for filters:', err);
    return result;
  }

  for (const [rawKey, rawValue] of entries) {
    const key = (rawKey || '').toLowerCase().trim();
    const value = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue || '').trim();

    // 1. Explicitly detect and ignore marketing tracking parameters
    if (isMarketingTrackingParam(key)) {
      result.ignoredTrackingParams.push(key);
      continue;
    }

    // 2. Ignore any parameter that is NOT an allowed car filter key
    if (!isValidCarFilterKey(key)) {
      continue;
    }

    // 3. Skip empty or placeholder values
    if (!value || value === 'undefined' || value === 'null') {
      continue;
    }

    // 4. Map valid keys to normalized filter state
    switch (key) {
      case 'search':
      case 'q':
      case 'keyword':
        result.search = value;
        result.hasActiveFilters = true;
        break;

      case 'make':
      case 'brand':
        result.make = value;
        result.hasActiveFilters = true;
        break;

      case 'model':
        result.model = value;
        result.hasActiveFilters = true;
        break;

      case 'category': {
        const cat = normalizeCategory(value);
        result.category = cat;
        if (cat !== 'all') result.hasActiveFilters = true;
        break;
      }

      case 'year': {
        const y = parseInt(value, 10);
        if (!isNaN(y) && y >= 1970 && y <= 2035) {
          result.year = String(y);
          result.hasActiveFilters = true;
        }
        break;
      }

      case 'zone':
      case 'location':
      case 'city': {
        const z = normalizeZone(value);
        result.zone = z;
        if (z !== 'all') result.hasActiveFilters = true;
        break;
      }

      case 'drivermode':
      case 'driver_mode':
      case 'driver': {
        const dm = normalizeDriverMode(value);
        result.driverMode = dm;
        if (dm !== 'all') result.hasActiveFilters = true;
        break;
      }

      case 'minprice':
      case 'min_price': {
        const minVal = parseFloat(value);
        if (!isNaN(minVal) && minVal >= 0) {
          result.minPrice = String(minVal);
          result.hasActiveFilters = true;
        }
        break;
      }

      case 'maxprice':
      case 'max_price': {
        const maxVal = parseFloat(value);
        if (!isNaN(maxVal) && maxVal > 0) {
          result.maxPrice = String(maxVal);
          result.hasActiveFilters = true;
        }
        break;
      }

      case 'sortby':
      case 'sort':
      case 'order': {
        const s = value.toLowerCase();
        if (['newest', 'price_asc', 'price_desc'].includes(s)) {
          result.sortBy = s;
        }
        break;
      }

      case 'view':
      case 'viewmode':
      case 'view_mode': {
        const v = value.toLowerCase();
        if (v === 'saved' || v === 'explore') {
          result.viewMode = v;
        }
        break;
      }

      default:
        break;
    }
  }

  return result;
}

/**
 * Returns a clean query string containing ONLY valid filter parameters,
 * completely stripped of all marketing tracking parameters.
 */
export function stripMarketingParamsFromUrl(urlStringOrSearch) {
  if (!urlStringOrSearch) return '';
  try {
    const isFullUrl = urlStringOrSearch.startsWith('http://') || urlStringOrSearch.startsWith('https://');
    const url = isFullUrl ? new URL(urlStringOrSearch) : new URL(`http://dummy.local${urlStringOrSearch.startsWith('/') ? '' : '/'}${urlStringOrSearch}`);
    
    const cleanParams = new URLSearchParams();
    url.searchParams.forEach((val, key) => {
      if (!isMarketingTrackingParam(key) && isValidCarFilterKey(key)) {
        cleanParams.append(key, val);
      }
    });

    const cleanSearch = cleanParams.toString();
    if (isFullUrl) {
      url.search = cleanSearch;
      return url.toString();
    }
    return cleanSearch ? `?${cleanSearch}` : '';
  } catch {
    return '';
  }
}
