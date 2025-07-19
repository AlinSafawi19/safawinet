# StatusBadge Component

A reusable React component for displaying status badges with customizable text and tooltips.

## Features

- **Flexible Status Types**: Supports active/inactive, enabled/disabled, online/offline, and more
- **Customizable Text**: Configurable text for active and inactive states
- **Tooltip Support**: Built-in tooltip functionality with customizable text
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **Dark Theme Support**: Automatically adapts to dark mode preferences
- **High Contrast Support**: Enhanced visibility for accessibility
- **Animation**: Subtle pulse animation for active states

## Usage

### Basic Usage

```jsx
import StatusBadge from '../components/StatusBadge';

// Simple status badge
<StatusBadge isActive={true} />

// With custom text
<StatusBadge isActive={false} inactiveText="Disabled" />

// Without tooltip
<StatusBadge isActive={true} showTooltip={false} />

// With custom tooltip
<StatusBadge isActive={true} tooltipText="User is currently active" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isActive` | `boolean` | **required** | The status value (true for active, false for inactive) |
| `className` | `string` | `''` | Additional CSS classes |
| `showTooltip` | `boolean` | `true` | Whether to show tooltip |
| `tooltipText` | `string` | `null` | Custom tooltip text (optional) |
| `activeText` | `string` | `'Active'` | Custom text for active status |
| `inactiveText` | `string` | `'Inactive'` | Custom text for inactive status |

### Examples

```jsx
// Different status types
<StatusBadge isActive={true} />
<StatusBadge isActive={false} />

// With custom text
<StatusBadge isActive={true} activeText="Online" />
<StatusBadge isActive={false} inactiveText="Offline" />

// With custom styling
<StatusBadge isActive={true} className="my-custom-class" />

// With custom tooltip
<StatusBadge 
  isActive={true} 
  tooltipText="User is currently active and online" 
/>

// Without tooltip
<StatusBadge isActive={true} showTooltip={false} />

// Different contexts
<StatusBadge isActive={user.isActive} />
<StatusBadge isActive={feature.isEnabled} activeText="Enabled" inactiveText="Disabled" />
<StatusBadge isActive={connection.isOnline} activeText="Online" inactiveText="Offline" />
```

## Styling

The component uses its own CSS file (`StatusBadge.css`) with the following features:

### Base Styles
- `.status-badge`: Base styling for all status badges
- Responsive padding and font sizes
- Proper overflow handling (no ellipsis)
- Smooth transitions and hover effects

### Status Variants
- `.status-badge.active`: Green theme for active/enabled states
- `.status-badge.inactive`: Red theme for inactive/disabled states
- `.status-badge.enabled`: Green theme (same as active)
- `.status-badge.disabled`: Red theme (same as inactive)
- `.status-badge.online`: Green theme for online status
- `.status-badge.offline`: Gray theme for offline status
- `.status-badge.verified`: Blue theme for verified status
- `.status-badge.unverified`: Yellow theme for unverified status
- `.status-badge.sent`: Green theme for sent status
- `.status-badge.not-sent`: Red theme for not sent status
- `.status-badge.connected`: Green theme for connected status
- `.status-badge.disconnected`: Gray theme for disconnected status
- `.status-badge.warning`: Yellow theme for warning status
- `.status-badge.error`: Red theme for error status
- `.status-badge.success`: Green theme for success status
- `.status-badge.info`: Blue theme for info status

### Responsive Design
```css
@media (max-width: 768px) {
  .status-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
  }
}
```

### Dark Theme Support
```css
@media (prefers-color-scheme: dark) {
  .status-badge.active {
    background-color: #14532d;
    color: #bbf7d0;
    border-color: #22c55e;
  }
  /* ... other status variants */
}
```

### Animation
```css
@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-badge.active,
.status-badge.enabled,
.status-badge.online,
.status-badge.connected {
  animation: statusPulse 2s infinite;
}
```

### Custom Sizes
```css
.status-badge.status-sm { /* Small size */ }
.status-badge.status-lg { /* Large size */ }
.status-badge.status-xl { /* Extra large size */ }
```

## Integration

### Tooltip Integration
Uses the `Tooltip` component for consistent tooltip behavior:

```jsx
<Tooltip text={tooltipText || statusText} showOnTruncated={false}>
  <span className={`status-badge ${statusClass}`}>
    {statusText}
  </span>
</Tooltip>
```

## Migration from Inline Implementation

### Before (Inline)
```jsx
const getStatusBadge = (isActive) => {
  const statusText = isActive ? 'Active' : 'Inactive';
  
  return (
    <Tooltip text={statusText} showOnTruncated={false}>
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {statusText}
      </span>
    </Tooltip>
  );
};

// Usage
{getStatusBadge(user.isActive)}
```

### After (Component)
```jsx
import StatusBadge from '../components/StatusBadge';

// Usage
<StatusBadge isActive={user.isActive} />
```

## Benefits

1. **Reusability**: Use across multiple pages and components
2. **Consistency**: Ensures uniform styling and behavior
3. **Maintainability**: Centralized styling and logic
4. **Flexibility**: Customizable text and tooltips
5. **Accessibility**: Built-in accessibility features
6. **Responsive**: Works on all screen sizes
7. **Animation**: Subtle visual feedback for active states

## Files

- **Component**: `client/src/components/StatusBadge.js`
- **Styles**: `client/src/styles/StatusBadge.css`
- **Documentation**: `client/src/components/StatusBadge.md`

## Dependencies

- `react`: Core React functionality
- `Tooltip`: Tooltip component
- `StatusBadge.css`: Component styles

## Use Cases

- **User Status**: Active/Inactive users
- **Feature Flags**: Enabled/Disabled features
- **Connection Status**: Online/Offline indicators
- **Verification Status**: Verified/Unverified items
- **Email Status**: Sent/Not sent emails
- **System Status**: Connected/Disconnected systems
- **Security Status**: Locked/Unlocked accounts
- **Notification Status**: Read/Unread notifications 