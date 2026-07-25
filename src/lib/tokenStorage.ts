import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// One abstraction so the same auth code runs on iOS/Android (SecureStore)
// and web (localStorage). SecureStore is native-only and throws on web.
const KEY = 'customer_inventory_token';

export async function getToken(): Promise<string | null> {
	if (Platform.OS === 'web') {
		try {
			return globalThis.localStorage?.getItem(KEY) ?? null;
		} catch {
			return null;
		}
	}
	return await SecureStore.getItemAsync(KEY);
}

export async function setToken(token: string): Promise<void> {
	if (Platform.OS === 'web') {
		try {
			globalThis.localStorage?.setItem(KEY, token);
		} catch {
			// ignore
		}
		return;
	}
	await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
	if (Platform.OS === 'web') {
		try {
			globalThis.localStorage?.removeItem(KEY);
		} catch {
			// ignore
		}
		return;
	}
	await SecureStore.deleteItemAsync(KEY);
}
