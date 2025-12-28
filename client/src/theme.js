// MongoDB Atlas-inspired theme - Light, clean, modern
export const theme = {
  token: {
    // Primary colors - MongoDB green
    colorPrimary: '#00684A',        // MongoDB dark green
    colorSuccess: '#00ED64',        // MongoDB bright green
    colorInfo: '#00A35C',           // Medium green
    colorWarning: '#FFB000',        // Warm yellow
    colorError: '#EA3829',          // MongoDB red
    
    // Background colors - Light & airy
    colorBgBase: '#FFFFFF',         // White
    colorBgContainer: '#FFFFFF',    // White containers
    colorBgLayout: '#F9FBFA',       // Very light mint
    colorBgElevated: '#FFFFFF',     // Elevated surfaces
    
    // Border and divider
    colorBorder: '#E3E8E8',         // Light gray border
    colorBorderSecondary: '#EDF2F2',
    
    // Text colors
    colorText: '#001E2B',           // Very dark blue-gray
    colorTextSecondary: '#5C6C75',  // Medium gray
    colorTextTertiary: '#89979F',   // Light gray
    
    // Border radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    
    // Spacing
    padding: 20,
    paddingLG: 28,
    
    // Font - Using Euclid (MongoDB's font) alternative
    fontSize: 15,
    fontSizeHeading1: 48,
    fontSizeHeading2: 36,
    fontSizeHeading3: 28,
    fontSizeHeading4: 22,
    fontSizeHeading5: 18,
    fontFamily: "'Euclidcircularb', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeightStrong: 600,
    lineHeight: 1.6,
  },
  components: {
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      bodyBg: '#F9FBFA',
      triggerBg: '#00684A',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#E8F5F1',
      itemHoverBg: '#F4FAF8',
      itemSelectedColor: '#00684A',
      itemColor: '#5C6C75',
      itemBorderRadius: 10,
      itemMarginInline: 8,
      itemPaddingInline: 16,
    },
    Button: {
      primaryColor: '#FFFFFF',
      primaryShadow: '0 4px 16px rgba(0, 104, 74, 0.15)',
      defaultBg: '#FFFFFF',
      defaultBorderColor: '#E3E8E8',
      defaultColor: '#5C6C75',
      colorBgTextHover: '#F4FAF8',
      colorBgTextActive: '#E8F5F1',
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 600,
      borderRadius: 10,
    },
    Card: {
      colorBgContainer: '#FFFFFF',
      colorBorderSecondary: '#E3E8E8',
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06)',
      borderRadiusLG: 16,
      paddingLG: 28,
    },
    Input: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E3E8E8',
      colorText: '#001E2B',
      colorTextPlaceholder: '#89979F',
      activeBorderColor: '#00684A',
      hoverBorderColor: '#00A35C',
      controlHeight: 44,
      borderRadius: 10,
      paddingInline: 16,
    },
    Select: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E3E8E8',
      colorText: '#001E2B',
      colorTextPlaceholder: '#89979F',
      optionSelectedBg: '#E8F5F1',
      controlHeight: 44,
      borderRadius: 10,
    },
    Table: {
      colorBgContainer: '#FFFFFF',
      colorBorderSecondary: '#EDF2F2',
      headerBg: '#F9FBFA',
      headerColor: '#001E2B',
      rowHoverBg: '#F9FBFA',
      borderRadius: 12,
    },
    Tag: {
      defaultBg: '#F4FAF8',
      defaultColor: '#5C6C75',
      borderRadiusSM: 6,
    },
    Progress: {
      defaultColor: '#00ED64',
      remainingColor: '#EDF2F2',
      lineBorderRadius: 100,
    },
    Steps: {
      dotSize: 12,
      iconSize: 40,
    },
    Upload: {
      colorBorder: '#E3E8E8',
      colorBgContainerDisabled: '#F9FBFA',
    },
  },
};