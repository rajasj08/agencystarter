/**
 * Single import for theme. Use: import theme from "@/theme"
 */

import { colors } from "./colors";
import { fonts } from "./fonts";
import { spacing } from "./spacing";
import { layout } from "./layout";
import { shadows } from "./shadows";
import { borders } from "./borders";
import { radius } from "./radius";
import { zIndex } from "./zindex";

const theme = {
  colors,
  fonts,
  spacing,
  layout,
  shadows,
  borders,
  radius,
  zIndex,
};

export default theme;
export { colors, fonts, spacing, layout, shadows, borders, radius, zIndex };
