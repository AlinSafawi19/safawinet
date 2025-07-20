# RiskBadge Component

A reusable React component for displaying risk levels with appropriate colors, icons, and styling.

## Features

- **Color-coded risk levels**: Each risk level has its own color scheme
- **Icons**: Built-in icons for each risk level (can be disabled)
- **Multiple sizes**: Small, medium, and large variants
- **Customizable**: Supports custom CSS classes and styling
- **Accessible**: Proper focus states and semantic markup
- **Responsive**: Adapts to different screen sizes

## Risk Levels

| Level | Color | Icon | Description |
|-------|-------|------|-------------|
| `critical` | Red | Alert Triangle | Most severe security events |
| `high` | Orange | Alert Circle | High-risk security events |
| `medium` | Yellow | Shield | Medium-risk events |
| `low` | Green | Check Circle | Low-risk or normal events |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `riskLevel` | string | `'low'` | Risk level: 'low', 'medium', 'high', 'critical' |
| `className` | string | `''` | Additional CSS classes |
| `showIcon` | boolean | `true` | Whether to display the risk icon |
| `size` | string | `'md'` | Badge size: 'sm', 'md', 'lg' |
| `uppercase` | boolean | `true` | Whether to display text in uppercase |

## Usage Examples

### Basic Usage

```jsx
import { RiskBadge } from '../components';

// Simple usage
<RiskBadge riskLevel="high" />

// Different sizes
<RiskBadge riskLevel="critical" size="lg" />
<RiskBadge riskLevel="medium" size="sm" />

// Without icon
<RiskBadge riskLevel="low" showIcon={false} />
```

### In Tables

```jsx
// In an audit logs table
<td className="risk-cell">
  <RiskBadge riskLevel={log.riskLevel || 'low'} size="sm" />
</td>
```

### Custom Styling

```jsx
// With custom CSS classes
<RiskBadge 
  riskLevel="high" 
  className="risk-badge-compact" 
  size="sm" 
/>

// Inline styling
<RiskBadge 
  riskLevel="critical" 
  className="risk-badge-inline" 
/>
```

## CSS Classes

The component uses the following CSS classes:

- `.risk-badge` - Base badge styling
- `.risk-badge-sm` - Small size variant
- `.risk-badge-md` - Medium size variant (default)
- `.risk-badge-lg` - Large size variant
- `.risk-badge-icon` - Icon styling
- `.risk-badge-text` - Text styling
- `.risk-badge-compact` - Compact variant for tight spaces
- `.risk-badge-inline` - Inline variant for text
- `.risk-badge-status` - Status indicator variant

## Color Schemes

The component uses custom color values:

- **Critical**: Red theme (`#fef2f2` background, `#991b1b` text, `#dc2626` icon)
- **High**: Orange theme (`#fff7ed` background, `#9a3412` text, `#ea580c` icon)
- **Medium**: Yellow theme (`#fefce8` background, `#a16207` text, `#ca8a04` icon)
- **Low**: Green theme (`#f0fdf4` background, `#166534` text, `#16a34a` icon)

## Accessibility

- Proper focus states for keyboard navigation
- Semantic color coding for screen readers
- High contrast ratios for readability
- Screen reader friendly text labels

## Integration

The component is already integrated into the AuditLogs page and can be used throughout the application wherever risk levels need to be displayed.

## Example Component

See `RiskBadgeExample.js` for a comprehensive demonstration of all features and usage patterns. 