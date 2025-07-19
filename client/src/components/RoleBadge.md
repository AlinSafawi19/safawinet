# RoleBadge Component

A reusable React component for displaying role badges with dynamic colors and tooltips.

## Features

- **Dynamic Colors**: Automatically fetches role templates from the backend and applies corresponding colors
- **Tooltip Support**: Built-in tooltip functionality with customizable text
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **Dark Theme Support**: Automatically adapts to dark mode preferences
- **High Contrast Support**: Enhanced visibility for accessibility

## Usage

### Basic Usage

```jsx
import RoleBadge from '../components/RoleBadge';

// Simple role badge
<RoleBadge role="admin" />

// With custom tooltip
<RoleBadge role="custom" tooltipText="Custom Role" />

// Without tooltip
<RoleBadge role="manager" showTooltip={false} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | `string` | **required** | The role name (e.g., 'admin', 'manager', 'custom') |
| `className` | `string` | `''` | Additional CSS classes |
| `showTooltip` | `boolean` | `true` | Whether to show tooltip |
| `tooltipText` | `string` | `null` | Custom tooltip text (optional) |

### Examples

```jsx
// Different role types
<RoleBadge role="admin" />
<RoleBadge role="manager" />
<RoleBadge role="viewer" />
<RoleBadge role="custom" />
<RoleBadge role="user" />

// With custom styling
<RoleBadge role="admin" className="my-custom-class" />

// With custom tooltip
<RoleBadge 
  role="custom" 
  tooltipText="Custom Role with Special Permissions" 
/>

// Without tooltip
<RoleBadge role="admin" showTooltip={false} />
```

## Styling

The component uses its own CSS file (`RoleBadge.css`) with the following features:

### Base Styles
- `.role-badge`: Base styling for all role badges
- Responsive padding and font sizes
- Proper overflow handling (no ellipsis)

### Color Variants
- `.role-badge.role-admin`: Red theme
- `.role-badge.role-manager`: Blue theme  
- `.role-badge.role-viewer`: Green theme
- `.role-badge.role-custom`: Purple theme
- `.role-badge.role-user`: Gray theme

### Dynamic Gradients
The component supports dynamic gradient classes from role templates:
- `bg-gradient-to-r.from-blue-500.to-cyan-500`
- `bg-gradient-to-r.from-purple-500.to-pink-500`
- And many more...

### Responsive Design
```css
@media (max-width: 768px) {
  .role-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
  }
}
```

### Dark Theme Support
```css
@media (prefers-color-scheme: dark) {
  .role-badge.role-admin {
    background-color: #7f1d1d;
    color: #fecaca;
    border-color: #dc2626;
  }
  /* ... other role variants */
}
```

## Integration

### Backend Integration
The component automatically fetches role templates from the backend:

```javascript
// Fetches role templates for dynamic colors
const fetchRoleTemplates = async () => {
  const response = await roleTemplateService.getTemplates({
    page: 1,
    limit: 100,
    status: 'active'
  });
  // ... handle response
};
```

### Tooltip Integration
Uses the `Tooltip` component for consistent tooltip behavior:

```jsx
<Tooltip text={tooltipText || roleText} showOnTruncated={false}>
  <span className={`role-badge ${badgeColor}`}>
    {roleText}
  </span>
</Tooltip>
```

## Migration from Inline Implementation

### Before (Inline)
```jsx
const getRoleBadge = (role) => {
  const roleText = role.toUpperCase();
  const roleTemplate = roleTemplates.find(template => 
    template.name.toLowerCase() === role.toLowerCase()
  );
  const badgeColor = roleTemplate?.color || `role-${role.toLowerCase()}`;
  
  return (
    <Tooltip text={roleText} showOnTruncated={false}>
      <span className={`role-badge ${badgeColor}`}>
        {roleText}
      </span>
    </Tooltip>
  );
};

// Usage
{getRoleBadge(user.role)}
```

### After (Component)
```jsx
import RoleBadge from '../components/RoleBadge';

// Usage
<RoleBadge role={user.role} />
```

## Benefits

1. **Reusability**: Use across multiple pages and components
2. **Consistency**: Ensures uniform styling and behavior
3. **Maintainability**: Centralized styling and logic
4. **Performance**: Efficient role template fetching
5. **Accessibility**: Built-in accessibility features
6. **Responsive**: Works on all screen sizes

## Files

- **Component**: `client/src/components/RoleBadge.js`
- **Styles**: `client/src/styles/RoleBadge.css`
- **Documentation**: `client/src/components/RoleBadge.md`

## Dependencies

- `react`: Core React functionality
- `roleTemplateService`: Backend API integration
- `Tooltip`: Tooltip component
- `RoleBadge.css`: Component styles 