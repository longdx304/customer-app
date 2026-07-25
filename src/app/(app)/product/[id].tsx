import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api, type ProductVariantRow } from '@/lib/api';
import { getInventoryStatus } from '@/lib/inventoryStatus';
import { colors, shadows } from '@/constants/theme';

export default function ProductDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
		queryKey: ['product', id],
		queryFn: () => api.product(id),
		enabled: !!id,
	});

	const product = data?.product;
	const inventoryStatus = product
		? getInventoryStatus(product.total_quantity)
		: null;
	const isProductLowStock = inventoryStatus?.tone === 'low';
	const isProductOutOfStock = inventoryStatus?.tone === 'out';

	return (
		<View style={styles.container}>
			<Stack.Screen options={{ title: 'Chi tiết sản phẩm' }} />

			{isLoading ? (
				<View style={styles.centerState}>
					<ActivityIndicator size="large" color={colors.tealDark} />
					<Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
				</View>
			) : isError || !product ? (
				<View style={styles.centerState}>
					<Text style={styles.errorTitle}>Chưa tải được sản phẩm</Text>
					<Text style={styles.errorText}>
						{(error as Error)?.message ?? 'Không tải được sản phẩm'}
					</Text>
					<TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
						<Text style={styles.retryText}>Thử lại</Text>
					</TouchableOpacity>
				</View>
			) : (
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={refetch}
							tintColor={colors.tealDark}
						/>
					}
				>
					<View style={styles.productHeader}>
						{product.thumbnail ? (
							<Image
								source={{ uri: product.thumbnail }}
								style={styles.productImage}
								contentFit="cover"
								transition={150}
							/>
						) : (
							<View style={[styles.productImage, styles.imagePlaceholder]}>
								<Text style={styles.placeholderMark}>SYNA</Text>
								<Text style={styles.placeholderText}>Chưa có hình ảnh</Text>
							</View>
						)}

						<View style={styles.titleBlock}>
							<Text style={styles.eyebrow}>THÔNG TIN SẢN PHẨM</Text>
							<Text style={styles.title}>{product.title}</Text>
							<Text
								style={[
									styles.stockState,
									isProductLowStock && styles.lowStockState,
									isProductOutOfStock && styles.outOfStockState,
								]}
							>
								{inventoryStatus?.label}
							</Text>
						</View>
					</View>

					<View
						style={[
							styles.totalSection,
							isProductLowStock && styles.totalSectionLow,
							isProductOutOfStock && styles.totalSectionEmpty,
						]}
					>
						<View>
							<Text style={styles.totalLabel}>Tình trạng tồn kho</Text>
							<Text style={styles.totalHint}>Dựa trên tất cả phân loại</Text>
						</View>
						<Text
							style={[
								styles.totalValue,
								isProductLowStock && styles.totalValueLow,
								isProductOutOfStock && styles.totalValueEmpty,
							]}
							numberOfLines={1}
							adjustsFontSizeToFit
						>
							{inventoryStatus?.label}
						</Text>
					</View>

					{product.description ? (
						<View style={styles.descriptionSection}>
							<Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
							<Text style={styles.description}>{product.description}</Text>
						</View>
					) : null}

					<View style={styles.variantSection}>
						<View style={styles.sectionHeading}>
							<View>
								<Text style={styles.sectionTitle}>Tồn kho theo phân loại</Text>
								<Text style={styles.sectionSubtitle}>
									{product.variants.length} phân loại sản phẩm
								</Text>
							</View>
						</View>

						{product.variants.map((variant) => (
							<VariantRow key={variant.id} variant={variant} />
						))}
						{product.variants.length === 0 ? (
							<View style={styles.emptyVariants}>
								<Text style={styles.emptyTitle}>Chưa có phân loại</Text>
								<Text style={styles.emptyText}>
									Sản phẩm này chưa có dữ liệu tồn kho chi tiết.
								</Text>
							</View>
						) : null}
					</View>
				</ScrollView>
			)}
		</View>
	);
}

function VariantRow({ variant }: { variant: ProductVariantRow }) {
	const inventoryStatus = getInventoryStatus(variant.total_quantity);
	const isLowStock = inventoryStatus.tone === 'low';
	const isOutOfStock = inventoryStatus.tone === 'out';

	return (
		<View style={styles.variantCard}>
			<View style={styles.variantBody}>
				<Text style={styles.variantTitle}>
					{variant.title ?? 'Mặc định'}
				</Text>
				{variant.sku ? (
					<Text style={styles.variantSku}>SKU: {variant.sku}</Text>
				) : (
					<Text style={styles.variantSku}>Chưa có mã SKU</Text>
				)}
			</View>
			<View
				style={[
					styles.variantQuantity,
					isLowStock && styles.variantQuantityLow,
					isOutOfStock && styles.variantQuantityEmpty,
				]}
			>
				<Text
					style={[
						styles.variantValue,
						isLowStock && styles.variantValueLow,
						isOutOfStock && styles.variantValueEmpty,
					]}
					numberOfLines={1}
					adjustsFontSizeToFit
				>
					{inventoryStatus.label}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	scrollContent: { paddingBottom: 28 },
	centerState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 28,
	},
	loadingText: { color: colors.textMuted, fontSize: 14, marginTop: 12 },
	productHeader: {
		flexDirection: 'row',
		gap: 16,
		backgroundColor: colors.surface,
		paddingHorizontal: 18,
		paddingTop: 18,
		paddingBottom: 20,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.border,
	},
	productImage: {
		width: 116,
		height: 116,
		borderRadius: 8,
		backgroundColor: colors.surfaceMuted,
	},
	imagePlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.border,
	},
	placeholderMark: {
		color: colors.textLight,
		fontSize: 15,
		fontWeight: '800',
	},
	placeholderText: { color: colors.textLight, fontSize: 10, marginTop: 4 },
	titleBlock: { flex: 1, justifyContent: 'center' },
	eyebrow: { color: colors.tealDark, fontSize: 10, fontWeight: '800' },
	title: {
		color: colors.text,
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		marginTop: 6,
	},
	stockState: {
		alignSelf: 'flex-start',
		color: colors.success,
		fontSize: 12,
		fontWeight: '700',
		marginTop: 9,
	},
	lowStockState: { color: colors.tealDark },
	outOfStockState: { color: colors.danger },
	totalSection: {
		minHeight: 96,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 16,
		backgroundColor: colors.successBackground,
		borderLeftWidth: 4,
		borderLeftColor: colors.success,
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	totalSectionEmpty: {
		backgroundColor: colors.dangerBackground,
		borderLeftColor: colors.danger,
	},
	totalSectionLow: {
		backgroundColor: colors.background,
		borderLeftColor: colors.tealDark,
	},
	totalLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
	totalHint: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
	totalValue: {
		maxWidth: 140,
		color: colors.success,
		fontSize: 28,
		fontWeight: '800',
		textAlign: 'right',
	},
	totalValueLow: { color: colors.tealDark },
	totalValueEmpty: { color: colors.danger },
	descriptionSection: {
		backgroundColor: colors.surface,
		paddingHorizontal: 18,
		paddingVertical: 18,
		borderTopWidth: 8,
		borderTopColor: colors.background,
	},
	description: {
		color: colors.textMuted,
		fontSize: 14,
		lineHeight: 21,
		marginTop: 8,
	},
	variantSection: { paddingHorizontal: 16, paddingTop: 22 },
	sectionHeading: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginBottom: 12,
		paddingHorizontal: 2,
	},
	sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
	sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
	variantCard: {
		minHeight: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: 12,
		marginBottom: 9,
		...shadows.card,
	},
	variantBody: { flex: 1 },
	variantTitle: {
		color: colors.text,
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '700',
	},
	variantSku: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
	variantQuantity: {
		width: 86,
		minHeight: 52,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.successBackground,
		borderRadius: 8,
		paddingHorizontal: 5,
	},
	variantQuantityLow: { backgroundColor: colors.background },
	variantQuantityEmpty: { backgroundColor: colors.dangerBackground },
	variantValue: {
		width: '100%',
		color: colors.success,
		fontSize: 15,
		fontWeight: '800',
		textAlign: 'center',
	},
	variantValueLow: { color: colors.tealDark },
	variantValueEmpty: { color: colors.danger },
	emptyVariants: {
		alignItems: 'center',
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: 24,
	},
	emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
	emptyText: {
		color: colors.textMuted,
		fontSize: 13,
		lineHeight: 19,
		textAlign: 'center',
		marginTop: 5,
	},
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
});
