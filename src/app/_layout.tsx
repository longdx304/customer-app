import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/constants/theme';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
	},
});

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<StatusBar style="dark" />
					<Stack
						screenOptions={{
							headerShown: false,
							contentStyle: { backgroundColor: colors.background },
						}}
					/>
				</AuthProvider>
			</QueryClientProvider>
		</SafeAreaProvider>
	);
}
