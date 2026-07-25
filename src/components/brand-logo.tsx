import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

type BrandLogoProps = {
	compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
	return (
		<Image
			source={require('../../assets/images/logo.jpg')}
			style={compact ? styles.compact : styles.default}
			contentFit="contain"
			accessibilityLabel="SYNA B2B Distributor OS"
		/>
	);
}

const styles = StyleSheet.create({
	default: {
		width: 244,
		height: 78,
	},
	compact: {
		width: 126,
		height: 40,
	},
});
