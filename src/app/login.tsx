import { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/constants/theme';

export default function LoginScreen() {
	const { token, loading, login } = useAuth();
	const router = useRouter();
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!loading && token) {
		return <Redirect href="/" />;
	}

	const onSubmit = async () => {
		setError(null);
		if (!phone || !password) {
			setError('Vui lòng nhập số điện thoại và mật khẩu');
			return;
		}
		setSubmitting(true);
		try {
			await login(phone.trim(), password);
			router.replace('/');
		} catch (e) {
			const msg =
				e instanceof ApiError
					? e.message
					: 'Không kết nối được máy chủ. Vui lòng thử lại.';
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.brandSection}>
						<BrandLogo />
						<View style={styles.brandRule} />
						<Text style={styles.portalLabel}>CỔNG TRA CỨU KHÁCH HÀNG</Text>
						<Text style={styles.title}>Thông tin tồn kho</Text>
						<Text style={styles.subtitle}>
							Theo dõi số lượng sản phẩm nhanh chóng và chính xác.
						</Text>
					</View>

					<View style={styles.formSection}>
						<View style={styles.formHeader}>
							<Text style={styles.formTitle}>Đăng nhập</Text>
							<Text style={styles.formSubtitle}>
								Sử dụng tài khoản được SYNA cấp cho bạn
							</Text>
						</View>

						<Text style={styles.label}>Số điện thoại</Text>
						<TextInput
							style={styles.input}
							placeholder="Ví dụ: 0987 654 321"
							placeholderTextColor={colors.textLight}
							keyboardType="phone-pad"
							textContentType="telephoneNumber"
							autoCapitalize="none"
							autoCorrect={false}
							value={phone}
							onChangeText={setPhone}
							editable={!submitting}
							returnKeyType="next"
						/>

						<Text style={styles.label}>Mật khẩu</Text>
						<View style={styles.passwordWrap}>
							<TextInput
								style={styles.passwordInput}
								placeholder="Nhập mật khẩu"
								placeholderTextColor={colors.textLight}
								secureTextEntry={!showPassword}
								textContentType="password"
								autoCapitalize="none"
								autoCorrect={false}
								value={password}
								onChangeText={setPassword}
								editable={!submitting}
								returnKeyType="done"
								onSubmitEditing={onSubmit}
							/>
							<Pressable
								onPress={() => setShowPassword((current) => !current)}
								hitSlop={10}
								accessibilityRole="button"
								accessibilityLabel={
									showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
								}
							>
								<Text style={styles.passwordAction}>
									{showPassword ? 'Ẩn' : 'Hiện'}
								</Text>
							</Pressable>
						</View>

						{error ? (
							<View style={styles.errorBox}>
								<Text style={styles.error}>{error}</Text>
							</View>
						) : null}

						<TouchableOpacity
							style={[styles.button, submitting && styles.buttonDisabled]}
							onPress={onSubmit}
							disabled={submitting}
							activeOpacity={0.85}
						>
							{submitting ? (
								<ActivityIndicator color={colors.surface} />
							) : (
								<Text style={styles.buttonText}>Đăng nhập</Text>
							)}
						</TouchableOpacity>

						<Text style={styles.hint}>
							Cần hỗ trợ tài khoản? Vui lòng liên hệ nhân viên phụ trách.
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.surface },
	container: { flex: 1 },
	scrollContent: { flexGrow: 1, justifyContent: 'center' },
	brandSection: {
		alignItems: 'center',
		paddingHorizontal: 28,
		paddingTop: 36,
		paddingBottom: 30,
		backgroundColor: colors.surface,
	},
	brandRule: {
		width: 42,
		height: 3,
		borderRadius: 2,
		backgroundColor: colors.teal,
		marginTop: 8,
		marginBottom: 18,
	},
	portalLabel: {
		color: colors.tealDark,
		fontSize: 12,
		fontWeight: '700',
	},
	title: {
		fontSize: 28,
		fontWeight: '800',
		color: colors.navy,
		marginTop: 8,
	},
	subtitle: {
		maxWidth: 320,
		fontSize: 15,
		lineHeight: 22,
		color: colors.textMuted,
		textAlign: 'center',
		marginTop: 8,
	},
	formSection: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: 28,
		paddingBottom: 24,
		backgroundColor: colors.background,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	formHeader: { marginBottom: 20 },
	formTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
	formSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: colors.textMuted,
		marginTop: 4,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 7,
		marginTop: 10,
	},
	input: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: 15,
		height: 52,
		fontSize: 16,
		color: colors.text,
		backgroundColor: colors.surface,
	},
	passwordWrap: {
		height: 52,
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		backgroundColor: colors.surface,
		paddingRight: 15,
	},
	passwordInput: {
		flex: 1,
		height: 50,
		paddingHorizontal: 15,
		fontSize: 16,
		color: colors.text,
	},
	passwordAction: {
		color: colors.tealDark,
		fontSize: 14,
		fontWeight: '700',
	},
	errorBox: {
		backgroundColor: colors.dangerBackground,
		borderLeftWidth: 3,
		borderLeftColor: colors.danger,
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginTop: 14,
	},
	error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
	button: {
		height: 52,
		justifyContent: 'center',
		backgroundColor: colors.navy,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 22,
	},
	buttonDisabled: { opacity: 0.6 },
	buttonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
	hint: {
		color: colors.textMuted,
		fontSize: 13,
		lineHeight: 19,
		textAlign: 'center',
		marginTop: 18,
	},
});
