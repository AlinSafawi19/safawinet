# Components

This directory contains reusable React components for the webapp.

## Tooltip Component

A reusable tooltip component that can be used across the entire webapp.

### Features

- **Automatic positioning**: Tooltips appear above the element by default
- **Truncation detection**: Only shows tooltip if text is actually truncated (configurable)
- **Accessibility**: Supports keyboard navigation (focus/blur events)
- **Customizable**: Multiple positions, custom styling, and disabled state
- **Responsive**: Adapts to different screen sizes
- **Theme support**: Works with light/dark themes and high contrast mode

### Usage

```jsx
import Tooltip from '../components/Tooltip';

// Basic usage
<Tooltip text="This is a tooltip">
  <span>Hover me</span>
</Tooltip>

// With custom position
<Tooltip text="Bottom tooltip" position="bottom">
  <button>Hover me</button>
</Tooltip>

// Only show if text is truncated
<Tooltip text="Full text here" showOnTruncated={true}>
  <div style={{ width: '100px', overflow: 'hidden' }}>
    Very long text that might be truncated
  </div>
</Tooltip>

// Disabled tooltip
<Tooltip text="This won't show" disabled={true}>
  <span>No tooltip</span>
</Tooltip>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | The element that triggers the tooltip |
| `text` | string | - | The text to display in the tooltip (optional, will use children text if not provided) |
| `position` | string | 'top' | Tooltip position: 'top', 'bottom', 'left', 'right' |
| `className` | string | '' | Additional CSS classes for the trigger element |
| `disabled` | boolean | false | Whether the tooltip is disabled |
| `showOnTruncated` | boolean | true | Only show tooltip if text is truncated |

### CSS Classes

The component uses the following CSS classes:

- `.tooltip-trigger` - The trigger element wrapper
- `.custom-tooltip` - The tooltip container
- `.tooltip-top`, `.tooltip-bottom`, `.tooltip-left`, `.tooltip-right` - Position variants
- `.tooltip-arrow` - The tooltip arrow
- `.tooltip-arrow-top`, `.tooltip-arrow-bottom`, etc. - Arrow position variants

### Styling

The tooltip styles are defined in `../styles/Tooltip.css` and include:

- Dark theme support
- High contrast mode support
- Responsive design
- Accessibility improvements
- Smooth animations

### Migration from old tooltip implementation

The old inline tooltip implementation has been replaced with this reusable component. To migrate:

1. Import the Tooltip component
2. Wrap the element that needs a tooltip
3. Remove any inline tooltip CSS or JavaScript
4. The cursor styling is automatically applied via CSS

Example migration:

```jsx
// Old way
<div onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
  Text
</div>

// New way
<Tooltip text="Tooltip text">
  <div>Text</div>
</Tooltip>
``` 