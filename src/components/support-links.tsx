import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { supportLinks } from '@/constants/support';
import { colors } from '@/constants/theme';

export function SupportLinks() {
	const [error, setError] = useState<string | null>(null);

	const openLink = async (url: string) => {
		setError(null);
		try {
			await Linking.openURL(url);
		} catch {
			setError('Không mở được liên kết. Bạn có thể truy cập www.syna.vn để liên hệ hỗ trợ.');
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Cần hỗ trợ tài khoản?</Text>
			<View style={styles.links}>
				{supportLinks.map(({ label, url }) => (
					<Pressable
						key={url}
						onPress={() => openLink(url)}
						accessibilityRole="link"
						accessibilityLabel={label}
						style={({ pressed }) => [styles.link, pressed && styles.pressed]}
					>
						<Text style={styles.linkText}>{label}</Text>
					</Pressable>
				))}
			</View>
			{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { gap: 4, alignItems: 'center' },
	title: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
	links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
	link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 10 },
	linkText: { color: colors.tealDark, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
	pressed: { opacity: 0.65 },
	error: { color: colors.danger, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
