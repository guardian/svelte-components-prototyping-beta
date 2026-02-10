import { getJson } from '$lib/helpers/util.js'

const state = $state({
	googleSheetKey: null,
	googleSheetSheetName: 'sheet1',
	mapdata: []
})

// Common column names for lat/lng (case-insensitive match)
const LAT_NAMES = [
	'latitude',
	'lat',
	'latitud',
	'y' // sometimes used for lat in CSV exports
]
const LNG_NAMES = [
	'longitude',
	'long',
	'lng',
	'lon',
	'lngitude',
	'x' // sometimes used for lng in CSV exports
]

function findColumn(names, keys) {
	const lower = (s) => String(s ?? '').trim().toLowerCase()
	const keyList = keys.map(lower)
	for (const name of names) {
		const i = keyList.indexOf(name)
		if (i !== -1) return keys[i]
	}
	return null
}

function parseCoord(value) {
	if (value === null || value === undefined) return NaN
	const n = parseFloat(String(value).trim())
	return Number.isFinite(n) ? n : NaN
}

function hasValidCoords(row, latKey, lngKey) {
	const lat = parseCoord(row[latKey])
	const lng = parseCoord(row[lngKey])
	return !Number.isNaN(lat) && !Number.isNaN(lng)
}

/**
 * Normalize sheet rows: detect lat/lng columns, parse to numbers, filter invalid rows.
 * @param {Record<string, unknown>[]} rows
 * @returns {Record<string, unknown>[]}
 */
function normalizeMapRows(rows) {
	if (!Array.isArray(rows) || rows.length === 0) {
		console.log('[googlesheet] normalizeMapRows: no rows or empty array')
		return []
	}
	const keys = Object.keys(rows[0])
	const latKey = findColumn(LAT_NAMES, keys)
	const lngKey = findColumn(LNG_NAMES, keys)
	console.log('[googlesheet] normalizeMapRows: columns', keys, '→ latKey:', latKey, 'lngKey:', lngKey)
	if (!latKey || !lngKey) {
		console.warn('[googlesheet] normalizeMapRows: no lat/lng columns found, returning rows unchanged')
		return rows
	}

	const filtered = rows.filter((row) => hasValidCoords(row, latKey, lngKey))
	console.log('[googlesheet] normalizeMapRows: raw rows', rows.length, '→ with valid coords', filtered.length)
	return filtered.map((row) => {
		const out = { ...row }
		out.latitude = parseCoord(row[latKey])
		out.longitude = parseCoord(row[lngKey])
		return out
	})
}

const setGoogleSheetKey = (key) => {
	state.googleSheetKey = key
}
const setGoogleSheetSheetName = (name) => {
	state.googleSheetSheetName = name
}

const googleSheetData = async () => {
	const url = `https://interactive.guim.co.uk/docsdata/${state.googleSheetKey}.json`
	//console.log('[googlesheet] googleSheetData: fetching', url, 'sheet:', state.googleSheetSheetName)
	const data = await getJson(url)
	const sheet = data.sheets[state.googleSheetSheetName]
	const raw = Array.isArray(sheet) ? sheet : []
	//console.log('[googlesheet] googleSheetData: raw sheet length', raw.length, 'first row keys:', raw[0] ? Object.keys(raw[0]) : null)
	const normalized = normalizeMapRows(raw)
	const sample = normalized[0]
		? { latitude: normalized[0].latitude, longitude: normalized[0].longitude }
		: null
	//console.log('[googlesheet] googleSheetData: normalized length', normalized.length, 'sample:', sample)
	state.mapdata = normalized
}

export {
	state,
	googleSheetData,
	setGoogleSheetKey,
	setGoogleSheetSheetName,
}
