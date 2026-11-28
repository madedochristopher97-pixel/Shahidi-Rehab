'use strict';

/**
 * GET /api/visitors -> { today, week, month, year, updated }
 *
 * Reads visitor counts (GA4 "Users", i.e. activeUsers) from the Google Analytics Data API for the
 * footer counter in js/main.js. Runs as a Vercel serverless function; no npm packages, so the
 * service-account JWT is signed with Node's own crypto.
 *
 * Needs two Vercel environment variables (see README, "Visitor counter"):
 *   GA4_PROPERTY_ID        the numeric GA4 property ID (Admin > Property details), not the G-/GTM- ID
 *   GA_SERVICE_ACCOUNT_KEY the whole JSON key file of a service account with Viewer access to that property
 *
 * The response is cached at Vercel's edge for 15 minutes, so Google is asked at most a few times an
 * hour however many people load the footer. Any failure returns 503 and the footer simply stays hidden.
 */

const crypto = require('crypto');

const RANGES = [
  { name: 'today', startDate: 'today', endDate: 'today' },
  { name: 'week', startDate: '6daysAgo', endDate: 'today' },
  { name: 'month', startDate: '29daysAgo', endDate: 'today' },
  { name: 'year', startDate: '364daysAgo', endDate: 'today' },
];

function readConfig() {
  const propertyId = (process.env.GA4_PROPERTY_ID || '').trim();
  const rawKey = process.env.GA_SERVICE_ACCOUNT_KEY || '';
  if (!/^\d+$/.test(propertyId)) throw new Error('GA4_PROPERTY_ID is missing or not a numeric property ID');
  if (!rawKey) throw new Error('GA_SERVICE_ACCOUNT_KEY is missing');
  let key;
  try {
    key = JSON.parse(rawKey);
  } catch (e) {
    throw new Error('GA_SERVICE_ACCOUNT_KEY is not valid JSON; paste the whole key file');
  }
  if (!key.client_email || !key.private_key) throw new Error('GA_SERVICE_ACCOUNT_KEY has no client_email or private_key');
  // Tolerate a key whose newlines were escaped twice on the way into the dashboard.
  return { propertyId, clientEmail: key.client_email, privateKey: key.private_key.replace(/\\n/g, '\n') };
}

function b64url(value) {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
}

async function getAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64url({ alg: 'RS256', typ: 'JWT' }) + '.' + b64url({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: unsigned + '.' + signature,
    }),
  });
  if (!res.ok) throw new Error('Google token request failed: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const body = await res.json();
  if (!body.access_token) throw new Error('Google token response had no access_token');
  return body.access_token;
}

async function fetchCounts(propertyId, token) {
  const res = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ dateRanges: RANGES, metrics: [{ name: 'activeUsers' }] }),
  });
  if (!res.ok) throw new Error('GA runReport failed: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const report = await res.json();

  // With several date ranges GA adds a "dateRange" dimension holding each range's name.
  // A range with no visitors has no row at all, so every range starts at 0.
  const counts = {};
  RANGES.forEach((r) => { counts[r.name] = 0; });
  (report.rows || []).forEach((row) => {
    const name = row.dimensionValues && row.dimensionValues[0] && row.dimensionValues[0].value;
    const value = Number(row.metricValues && row.metricValues[0] && row.metricValues[0].value);
    if (Object.prototype.hasOwnProperty.call(counts, name) && Number.isFinite(value)) counts[name] = value;
  });
  return counts;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end();
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const config = readConfig();
    const token = await getAccessToken(config.clientEmail, config.privateKey);
    const counts = await fetchCounts(config.propertyId, token);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify(Object.assign(counts, { updated: new Date().toISOString() })));
  } catch (err) {
    // Details go to the Vercel function log only; visitors get a bare 503 and the footer stays hidden.
    console.error('[api/visitors]', err && err.message ? err.message : err);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'unavailable' }));
  }
};
