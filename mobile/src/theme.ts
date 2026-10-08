// ============================================
// BRD-COMPLIANT COLOR PALETTE
// Executive, muted, and professional
// ============================================

export const colors = {
  // Primary Colors (BRD Spec: Deep Slate/Navy + Emerald/Muted Mint)
  primary: '#1E293B',           // Deep Slate / Navy (Primary)
  primaryDark: '#0F172A',       // Darker slate for emphasis
  primaryLight: '#334155',      // Lighter slate for hover states
  accent: '#10B981',            // Emerald / Muted Mint (Accent)
  accentDark: '#059669',        // Darker mint for active states
  accentSoft: '#D1FAE5',        // Soft mint tint for backgrounds

  // Background & Surface
  background: '#F8FAFC',        // Clean Soft Off-White (BRD Spec)
  surface: '#FFFFFF',           // Crisp White (Card Surface)
  surfaceElevated: '#FFFFFF',   // Elevated cards (same as surface)

  // Text Colors
  text: '#0F172A',              // Dark Charcoal (Primary Text - BRD Spec)
  textSecondary: '#64748B',     // Cool Grey (Secondary Text - BRD Spec)
  textMuted: '#94A3B8',         // Lighter grey for hints
  textOnPrimary: '#FFFFFF',     // White text on primary background
  textOnAccent: '#FFFFFF',      // White text on accent background

  // Borders & Dividers
  border: '#E2E8F0',            // Subtle border (BRD Spec)
  borderLight: '#F1F5F9',       // Lighter border for subtle separation

  // Status Colors
  success: '#10B981',           // Green (same as accent)
  successSoft: '#D1FAE5',       // Soft green background
  warning: '#F59E0B',           // Amber for warnings
  warningSoft: '#FEF3C7',       // Soft amber background
  danger: '#DC2626',            // Red for errors/delete
  dangerSoft: '#FEE2E2',        // Soft red background
  info: '#3B82F6',              // Blue for information
  infoSoft: '#DBEAFE',          // Soft blue background

  // Overlay & Shadows
  overlay: 'rgba(15, 23, 42, 0.50)',     // Dark overlay for modals
  overlayLight: 'rgba(15, 23, 42, 0.25)', // Light overlay
  shadow: 'rgba(15, 23, 42, 0.08)',       // Subtle shadow color

  // Category-specific (maintaining existing palette)
  categoryTint: '#F8FAFC',      // Default category tint
};

// ============================================
// SPACING SCALE
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

// ============================================
// TYPOGRAPHY SCALE
// ============================================

export const typography = {
  // Font Sizes
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
    display: 40,
  },

  // Font Weights
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================
// BORDER RADIUS SCALE
// ============================================

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// ============================================
// SHADOW STYLES
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 8,
  },
};
