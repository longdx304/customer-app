import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand-logo';
import { SupportLinks } from '@/components/support-links';
import { colors } from '@/constants/theme';

const sections = [
	{
		title: '1. Phạm vi',
		body: 'Thông tin này áp dụng cho ứng dụng SYNA Tồn Kho, cổng tra cứu sản phẩm và tình trạng tồn kho dành cho khách hàng sử dụng tài khoản do SYNA cấp.',
	},
	{
		title: '2. Thông tin dùng trong ứng dụng',
		body: 'Khi đăng nhập, ứng dụng gửi số điện thoại và mật khẩu bạn nhập đến hệ thống SYNA để xác thực. Hệ thống trả về mã phiên đăng nhập và thông tin tài khoản như mã khách hàng, họ tên và số điện thoại. Ứng dụng sử dụng các thông tin này để duy trì phiên đăng nhập và hiển thị thông tin khách hàng.',
	},
	{
		title: '3. Tra cứu sản phẩm',
		body: 'Từ khóa tìm kiếm và yêu cầu xem sản phẩm được gửi đến hệ thống để trả về kết quả phù hợp. Ảnh sản phẩm được tải từ địa chỉ do hệ thống cung cấp. Việc tải dữ liệu và hình ảnh cần kết nối Internet.',
	},
	{
		title: '4. Lưu phiên trên thiết bị',
		body: 'Trên iOS và Android, mã phiên đăng nhập được lưu bằng cơ chế lưu trữ bảo mật của nền tảng thông qua SecureStore. Trên bản web, mã phiên được lưu trong bộ nhớ cục bộ của trình duyệt. Đăng xuất sẽ xóa mã phiên lưu bởi ứng dụng; thao tác này không xóa hồ sơ khách hàng trên hệ thống SYNA.',
	},
	{
		title: '5. Hỗ trợ về dữ liệu cá nhân',
		body: 'Bạn có thể liên hệ SYNA qua các kênh bên dưới để yêu cầu kiểm tra, chỉnh sửa hoặc xóa dữ liệu cá nhân, hoặc hỏi về việc lưu giữ và xử lý thông tin tài khoản. Khi liên hệ, không gửi mật khẩu hoặc mã phiên đăng nhập. Việc xóa dữ liệu cần được xử lý qua bộ phận phụ trách, không thực hiện bằng nút đăng xuất.',
	},
	{
		title: '6. Liên kết bên ngoài',
		body: 'Khi chọn Website, Zalo hoặc Messenger, bạn sẽ mở dịch vụ bên ngoài ứng dụng. Việc sử dụng các dịch vụ đó chịu sự điều chỉnh của chính sách quyền riêng tư tương ứng của bên cung cấp.',
	},
];

export default function PrivacyScreen() {
	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView contentContainerStyle={styles.content}>
				<BrandLogo compact />
				<Text accessibilityRole="header" style={styles.title}>Chính sách quyền riêng tư</Text>
				<Text style={styles.subtitle}>SYNA Tồn Kho</Text>
				{sections.map(({ title, body }) => (
					<View key={title} style={styles.section}>
						<Text accessibilityRole="header" style={styles.heading}>{title}</Text>
						<Text selectable style={styles.body}>{body}</Text>
					</View>
				))}
				<View style={styles.support}><SupportLinks /></View>
				<Link href="/login" replace asChild>
					<Pressable accessibilityRole="link" style={styles.back}>
						<Text style={styles.backText}>Về màn hình đăng nhập</Text>
					</Pressable>
				</Link>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.surface },
	content: { padding: 24, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
	title: { fontSize: 26, fontWeight: '700', color: colors.navy, marginTop: 12 },
	subtitle: { fontSize: 14, color: colors.textMuted },
	section: { gap: 8, marginTop: 12 },
	heading: { fontSize: 17, fontWeight: '700', color: colors.text },
	body: { fontSize: 15, lineHeight: 24, color: colors.text },
	support: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 24, marginTop: 12 },
	back: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
	backText: { fontSize: 14, fontWeight: '600', color: colors.tealDark, textDecorationLine: 'underline' },
});
