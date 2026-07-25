import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';
import { api, setUnauthorizedHandler, type AuthCustomer } from './api';
import { clearToken, getToken, setToken } from './tokenStorage';

type AuthState = {
	token: string | null;
	customer: AuthCustomer | null;
	loading: boolean;
	login: (phone: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
	token: null,
	customer: null,
	loading: true,
	login: async () => {},
	logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setTok] = useState<string | null>(null);
	const [customer, setCustomer] = useState<AuthCustomer | null>(null);
	const [loading, setLoading] = useState(true);

	const logout = useCallback(async () => {
		await clearToken();
		setTok(null);
		setCustomer(null);
	}, []);

	useEffect(() => {
		// On 401 anywhere, drop the session so guards redirect to login.
		setUnauthorizedHandler(() => {
			setTok(null);
			setCustomer(null);
		});

		(async () => {
			const existing = await getToken();
			if (existing) {
				setTok(existing);
				try {
					const { customer } = await api.me();
					setCustomer(customer);
				} catch {
					// invalid/expired token already cleared by the api layer
					setTok(null);
				}
			}
			setLoading(false);
		})();

		return () => setUnauthorizedHandler(null);
	}, []);

	const login = useCallback(async (phone: string, password: string) => {
		const res = await api.login(phone, password);
		await setToken(res.access_token);
		setTok(res.access_token);
		setCustomer(res.customer);
	}, []);

	return (
		<AuthContext.Provider
			value={{ token, customer, loading, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
