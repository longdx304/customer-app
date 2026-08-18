import { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api, type ProductListItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getInventoryStatus } from '@/lib/inventoryStatus';
import { colors, shadows } from '@/constants/theme';

const PAGE_SIZE = 20;

export default function ProductListScreen() {
	const { customer, logout } = useAuth();
	const [search, setSearch] = useState('');
	const [debounced, setDebounced] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(search.trim()), 350);
		return () => clearTimeout(timer);
	}, [search]);

	const {
		data,
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['products', debounced],
		queryFn: ({ pageParam }) =>
			api.products({ q: debounced, limit: PAGE_SIZE, offset: pageParam }),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const next = lastPage.offset + lastPage.limit;
			return next < lastPage.count ? next : undefined;
		},
	});

	const products = useMemo(
		() => data?.pages.flatMap((page) => page.products) ?? [],
		[data]
	);
	const total = data?.pages[0]?.count ?? 0;
	const customerName = [customer?.first_name, customer?.last_name]
		.filter(Boolean)
		.join(' ')
		.trim();

	const confirmLogout = () => {
		Alert.alert(
			'Đăng xuất',
			'Bạn có chắc muốn đăng xuất khỏi tài khoản này?',
			[
				{ text: 'Hủy', style: 'cancel' },
				{ text: 'Đăng xuất', style: 'destructive', onPress: logout },
			]
		);
	};

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					headerRight: () => (
						<TouchableOpacity
							onPress={confirmLogout}
							style={styles.logoutButton}
							accessibilityRole="button"
							accessibilityLabel="Đăng xuất"
						>
							<Text style={styles.logoutText}>Đăng xuất</Text>
						</TouchableOpacity>
					),
				}}
			/>

			<View style={styles.intro}>
				<Text style={styles.eyebrow}>KHO DÀNH CHO KHÁCH HÀNG</Text>
				<Text style={styles.screenTitle}>
					{customerName ? `Xin chào, ${customerName}` : 'Tồn kho sản phẩm'}
				</Text>
				<View style={styles.customerMeta}>
					<Text style={styles.updatedHint}>Kéo xuống để cập nhật dữ liệu</Text>
				</View>
			</View>

			<View style={styles.searchSection}>
				<Text style={styles.searchLabel}>Tìm sản phẩm</Text>
				<TextInput
					style={styles.searchInput}
					placeholder="Tên sản phẩm hoặc mã SKU"
					placeholderTextColor={colors.textLight}
					value={search}
					onChangeText={setSearch}
					autoCapitalize="none"
					autoCorrect={false}
					clearButtonMode="while-editing"
					returnKeyType="search"
				/>
				{!isLoading ? (
					<Text style={styles.countText}>
						{debounced
							? `${total} kết quả cho "${debounced}"`
							: `${total} sản phẩm đang hiển thị`}
					</Text>
				) : null}
			</View>

			{isLoading ? (
				<LoadingState />
			) : isError ? (
				<ErrorState
					message={(error as Error)?.message ?? 'Không tải được dữ liệu'}
					onRetry={() => refetch()}
				/>
			) : (
				<FlatList
					data={products}
					keyExtractor={(item) => item.id}
					contentContainerStyle={
						products.length === 0
							? styles.emptyListContent
							: styles.listContent
					}
					renderItem={({ item }) => <ProductRow item={item} />}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
							<Text style={styles.emptyText}>
								Thử tìm bằng tên khác hoặc kiểm tra lại mã SKU.
							</Text>
						</View>
					}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching && !isFetchingNextPage}
							onRefresh={refetch}
							tintColor={colors.tealDark}
						/>
					}
					onEndReachedThreshold={0.4}
					onEndReached={() => {
						if (hasNextPage && !isFetchingNextPage) fetchNextPage();
					}}
					ListFooterComponent={
						isFetchingNextPage ? (
							<ActivityIndicator
								style={styles.footerLoader}
								color={colors.tealDark}
							/>
						) : products.length > 0 ? (
							<Text style={styles.endText}>
								{hasNextPage ? 'Cuộn để xem thêm' : 'Đã hiển thị tất cả sản phẩm'}
							</Text>
						) : null
					}
				/>
			)}
		</View>
	);
}

function ProductRow({ item }: { item: ProductListItem }) {
	const inventoryStatus = getInventoryStatus(item.total_quantity);
	const isOutOfStock = inventoryStatus.tone === 'out';
	const isLowStock = inventoryStatus.tone === 'low';

	return (
		<Link href={`/product/${item.id}`} asChild>
			<TouchableOpacity style={styles.productCard} activeOpacity={0.75}>
				{item.thumbnail ? (
					<Image
						source={{ uri: item.thumbnail }}
						style={styles.thumbnail}
						contentFit="cover"
						transition={150}
					/>
				) : (
					<View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
						<Text style={styles.placeholderMark}>SYNA</Text>
					</View>
				)}
				<View style={styles.productBody}>
					<Text style={styles.productTitle} numberOfLines={2}>
						{item.title}
					</Text>
				</View>
				<View
					style={[
						styles.quantityBox,
						isLowStock && styles.quantityBoxLow,
						isOutOfStock && styles.quantityBoxEmpty,
					]}
				>
					<Text
						style={[
							styles.quantityValue,
							isLowStock && styles.quantityValueLow,
							isOutOfStock && styles.quantityValueEmpty,
						]}
						numberOfLines={1}
						adjustsFontSizeToFit
					>
						{inventoryStatus.label}
					</Text>
				</View>
			</TouchableOpacity>
		</Link>
	);
}

function LoadingState() {
	return (
		<View style={styles.centerState}>
			<ActivityIndicator size="large" color={colors.tealDark} />
			<Text style={styles.stateHint}>Đang lấy thông tin tồn kho...</Text>
		</View>
	);
}

function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<View style={styles.centerState}>
			<Text style={styles.errorTitle}>Chưa tải được dữ liệu</Text>
			<Text style={styles.errorText}>{message}</Text>
			<TouchableOpacity onPress={onRetry} style={styles.retryButton}>
				<Text style={styles.retryText}>Thử lại</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	logoutButton: { paddingHorizontal: 4, paddingVertical: 8 },
	logoutText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
	intro: {
		backgroundColor: colors.surface,
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 18,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.border,
	},
	eyebrow: { color: colors.tealDark, fontSize: 11, fontWeight: '800' },
	screenTitle: {
		color: colors.navy,
		fontSize: 23,
		fontWeight: '800',
		marginTop: 6,
	},
	customerMeta: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 8,
		marginTop: 9,
	},
	updatedHint: { color: colors.textMuted, fontSize: 12 },
	searchSection: {
		backgroundColor: colors.background,
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 10,
	},
	searchLabel: {
		color: colors.text,
		fontSize: 13,
		fontWeight: '700',
		marginBottom: 7,
	},
	searchInput: {
		height: 50,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: 15,
		fontSize: 15,
		color: colors.text,
		backgroundColor: colors.surface,
	},
	countText: {
		color: colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
		marginTop: 7,
		marginLeft: 2,
	},
	listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
	emptyListContent: { flexGrow: 1 },
	productCard: {
		minHeight: 88,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: 11,
		marginBottom: 9,
		...shadows.card,
	},
	thumbnail: {
		width: 64,
		height: 64,
		borderRadius: 7,
		backgroundColor: colors.surfaceMuted,
	},
	thumbnailPlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.border,
	},
	placeholderMark: {
		color: colors.textLight,
		fontSize: 10,
		fontWeight: '800',
	},
	productBody: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
	productTitle: {
		fontSize: 15,
		lineHeight: 20,
		color: colors.text,
		fontWeight: '700',
	},
	quantityBox: {
		width: 82,
		minHeight: 42,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.successBackground,
		borderRadius: 8,
		paddingHorizontal: 5,
	},
	quantityBoxLow: { backgroundColor: colors.warningBackground },
	quantityBoxEmpty: { backgroundColor: colors.dangerBackground },
	quantityValue: {
		width: '100%',
		color: colors.success,
		fontSize: 15,
		fontWeight: '800',
		textAlign: 'center',
	},
	quantityValueLow: { color: colors.warning },
	quantityValueEmpty: { color: colors.danger },
	centerState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 28,
		paddingBottom: 40,
	},
	stateHint: { color: colors.textMuted, fontSize: 14, marginTop: 12 },
	errorTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
	errorText: {
		color: colors.danger,
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center',
		marginTop: 7,
	},
	retryButton: {
		minWidth: 112,
		height: 44,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.navy,
		borderRadius: 8,
		marginTop: 18,
	},
	retryText: { color: colors.surface, fontWeight: '700' },
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		paddingBottom: 48,
	},
	emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
	emptyText: {
		color: colors.textMuted,
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center',
		marginTop: 6,
	},
	footerLoader: { marginVertical: 18 },
	endText: {
		color: colors.textLight,
		fontSize: 12,
		textAlign: 'center',
		marginVertical: 12,
	},
});
