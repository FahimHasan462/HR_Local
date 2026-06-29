const { parse } = require("csv-parse/sync");

const cell = (row, index) => (row[index] ?? "").trim();

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const cutCol = rows[i].findIndex((value) => /^cut$/i.test(cell([value], 0)));
    if (cutCol >= 0) return { index: i, cutCol };
  }
  return { index: 1, cutCol: 1 };
}

function findColumnIndex(headerRow, patterns) {
  for (let i = 0; i < headerRow.length; i++) {
    const label = cell(headerRow, i).toLowerCase();
    if (patterns.some((pattern) => pattern.test(label))) return i;
  }
  return -1;
}

function csvUrlToLinkHtmlUrl(sheetUrl) {
  const url = new URL(sheetUrl);
  const match = url.pathname.match(/\/spreadsheets\/d\/e\/([^/]+)\//);
  if (!match) return null;

  const gid = url.searchParams.get("gid") ?? "0";
  return `https://docs.google.com/spreadsheets/d/e/${match[1]}/pubhtml/sheet?headers=false&gid=${gid}`;
}

function resolveRedirectUrl(href) {
  try {
    const parsed = new URL(href.replace(/&amp;/g, "&"));
    if (parsed.hostname === "www.google.com" && parsed.pathname === "/url") {
      const target = parsed.searchParams.get("q") ?? parsed.searchParams.get("url");
      if (target) return target;
    }
    return href.replace(/&amp;/g, "&");
  } catch {
    return href;
  }
}

async function fetchCutLinks(htmlUrl) {
  const response = await fetch(htmlUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet links (${response.status})`);
  }

  const html = await response.text();
  const links = new Map();
  const pattern = /href="([^"]+)"[^>]*>([^<]*Cut_[^<]*)</g;

  for (const match of html.matchAll(pattern)) {
    const cut = match[2].trim();
    if (!cut || links.has(cut)) continue;
    links.set(cut, resolveRedirectUrl(match[1]));
  }

  return links;
}

async function loadSheetRows(sheetUrl) {
  const linkHtmlUrl = csvUrlToLinkHtmlUrl(sheetUrl);
  const [csvResponse, cutLinks] = await Promise.all([
    fetch(sheetUrl),
    linkHtmlUrl ? fetchCutLinks(linkHtmlUrl).catch(() => new Map()) : Promise.resolve(new Map()),
  ]);

  if (!csvResponse.ok) {
    throw new Error(`Failed to fetch sheet (${csvResponse.status})`);
  }

  const text = await csvResponse.text();
  const rows = parse(text, {
    relax_column_count: true,
    skip_empty_lines: true,
    bom: true,
  });

  const { index: headerIndex, cutCol } = findHeaderRow(rows);
  const headerRow = rows[headerIndex] ?? [];
  const artistCol = findColumnIndex(headerRow, [/artist/]);
  const statusCol = findColumnIndex(headerRow, [/status/, /shot status/]);

  if (artistCol < 0 || statusCol < 0) {
    throw new Error("Could not locate Artist or Status columns in sheet.");
  }

  return { rows, headerIndex, cutCol, artistCol, statusCol, cutLinks };
}

/**
 * Fetch a published Google Sheet CSV and return cuts grouped by artist name.
 */
async function fetchCutsGroupedByArtist(sheetUrl) {
  const { rows, headerIndex, cutCol, artistCol, statusCol, cutLinks } =
    await loadSheetRows(sheetUrl);

  const byArtist = new Map();

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const artist = cell(row, artistCol);
    if (!artist) continue;

    const cut = cell(row, cutCol);
    if (!cut || /^cut$/i.test(cut)) continue;

    const entry = {
      cut,
      status: cell(row, statusCol),
      url: cutLinks.get(cut) ?? "",
    };

    if (!byArtist.has(artist)) {
      byArtist.set(artist, []);
    }
    byArtist.get(artist).push(entry);
  }

  return byArtist;
}

/**
 * Fetch a published Google Sheet CSV and return cuts assigned to artistName.
 */
async function fetchCutsForArtist(sheetUrl, artistName) {
  const byArtist = await fetchCutsGroupedByArtist(sheetUrl);
  return byArtist.get(artistName) ?? [];
}

module.exports = {
  fetchCutsForArtist,
  fetchCutsGroupedByArtist,
  csvUrlToLinkHtmlUrl,
  fetchCutLinks,
};