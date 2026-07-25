import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/constants/theme';

export default function AppLayout() {
	const { token, loading } = useAuth();

	if (loading) {
		return (
			<View style={styles.loading}>
				<BrandLogo />
				<ActivityIndicator
					size="small"
					color={colors.tealDark}
					style={styles.loadingIndicator}
				/>
				<Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
			</View>
		);
	}

	if (!token) {
		return <Redirect href="/login" />;
	}

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.surface },
				headerTintColor: colors.navy,
				headerTitleAlign: 'center',
				headerShadowVisible: false,
				headerBackTitle: 'Kho',
				headerTitle: () => <BrandLogo compact />,
				headerTitleStyle: { fontWeight: '700' },
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="index" options={{ title: 'Tồn kho' }} />
			<Stack.Screen name="product/[id]" options={{ title: 'Chi tiết' }} />
		</Stack>
	);
}

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.surface,
		padding: 24,
	},
	loadingIndicator: { marginTop: 20 },
	loadingText: { color: colors.textMuted, fontSize: 14, marginTop: 10 },
});
