import type { SearchImportPrefill } from './searchImport';

export type ChartSourceChoice = {
  id: string;
  label: string;
  domain: string;
  description: string;
  url: string;
};

export function chartSourceProviderRequiresApiKey() {
  return false;
}

export function chartSourceQuery(prefill: Pick<SearchImportPrefill, 'title' | 'artist'>) {
  return [prefill.title.trim(), prefill.artist.trim(), 'chords'].filter(Boolean).join(' ');
}

export function quotedChartSourceQuery(prefill: Pick<SearchImportPrefill, 'title' | 'artist'>) {
  const title = prefill.title.trim();
  const artist = prefill.artist.trim();
  return [title ? `"${title}"` : '', artist ? `"${artist}"` : '', 'chords'].filter(Boolean).join(' ');
}

export function webSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function chartSourceChoices(prefill: SearchImportPrefill): ChartSourceChoice[] {
  const query = chartSourceQuery(prefill);
  const quotedQuery = quotedChartSourceQuery(prefill);

  return [
    {
      id: 'ultimate-guitar',
      label: 'Search Ultimate Guitar',
      domain: 'ultimate-guitar.com',
      description: 'Open Ultimate Guitar search for the verified title and artist.',
      url: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`
    },
    {
      id: 'chordify',
      label: 'Search Chordify',
      domain: 'chordify.net',
      description: 'Open web search results restricted to Chordify.',
      url: webSearchUrl(`${quotedQuery} site:chordify.net`)
    },
    {
      id: 'songsterr',
      label: 'Search Songsterr',
      domain: 'songsterr.com',
      description: 'Open Songsterr search for the verified title and artist.',
      url: `https://www.songsterr.com/?pattern=${encodeURIComponent(query)}`
    },
    {
      id: 'web',
      label: 'Search the Web',
      domain: 'web search',
      description: 'Open a general web search for likely chord pages.',
      url: webSearchUrl(quotedQuery)
    }
  ];
}

export function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
