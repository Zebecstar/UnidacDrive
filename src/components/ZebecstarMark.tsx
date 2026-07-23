import Svg, { G, Polygon } from 'react-native-svg';
import { colors } from '../theme';

type ZebecstarMarkProps = {
  size?: number;
  color?: string;
};

export function ZebecstarMark({ size = 36, color = colors.amber400 }: ZebecstarMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="165 140 925 925" accessibilityLabel="Zebecstar angular gem-star mark">
      <G fill={color}>
        <Polygon points="623,179 507,391 321,544 573,457 592,398" />
        <Polygon points="632,179 664,398 683,457 934,543 748,390" />
        <Polygon points="933,553 787,561 620,728 745,742 802,775 780,665" />
        <Polygon points="321,554 478,664 454,784 523,698 657,562" />
        <Polygon points="459,803 623,1025 593,827 580,805" />
        <Polygon points="798,803 676,804 663,831 633,1025" />
      </G>
    </Svg>
  );
}
