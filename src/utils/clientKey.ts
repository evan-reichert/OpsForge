const CLIENT_KEY_STORAGE = 'opsforge_client_key'

function buildRandomKey(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID().replace(/[^A-Za-z0-9._-]/g, '_')
	}
	return `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export function getClientKey(): string {
	let key = localStorage.getItem(CLIENT_KEY_STORAGE) ?? ''
	key = key.trim()
	if (!key) {
		key = buildRandomKey()
		localStorage.setItem(CLIENT_KEY_STORAGE, key)
	}
	return key
}
