# Checkbox Component

A reusable, accessible checkbox component with multiple variants and sizes.

## Features

- ✅ **Accessible**: Full keyboard navigation and screen reader support
- 🎨 **Multiple Variants**: Primary, secondary, success, warning, danger colors
- 📏 **Size Options**: Small, medium (default), large
- ♿ **Accessibility**: ARIA attributes, focus indicators, high contrast support
- 🌙 **Dark Mode**: Automatic dark mode support
- 📱 **Responsive**: Mobile-friendly design
- 🎯 **Customizable**: Flexible props for different use cases

## Basic Usage

```jsx
import Checkbox from './components/Checkbox';

const [checked, setChecked] = useState(false);

<Checkbox
  id="my-checkbox"
  name="my-checkbox"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  label="My checkbox"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | auto-generated | Unique identifier for the checkbox |
| `name` | string | - | Name attribute for the checkbox |
| `checked` | boolean | **required** | Whether the checkbox is checked |
| `onChange` | function | **required** | Callback when checkbox state changes |
| `disabled` | boolean | false | Whether the checkbox is disabled |
| `label` | string | - | Label text for the checkbox |
| `description` | string | - | Optional description text |
| `className` | string | '' | Additional CSS classes |
| `required` | boolean | false | Whether the field is required |
| `size` | 'small' \| 'medium' \| 'large' | 'medium' | Size variant |
| `variant` | 'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' | 'default' | Color variant |

## Examples

### Basic Checkbox
```jsx
<Checkbox
  id="basic"
  name="basic"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  label="Basic checkbox"
/>
```

### With Description
```jsx
<Checkbox
  id="with-description"
  name="withDescription"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  label="Checkbox with description"
  description="This is a detailed description that explains what this checkbox does."
/>
```

### Required Field
```jsx
<Checkbox
  id="required"
  name="required"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  label="Required checkbox"
  required={true}
/>
```

### Disabled State
```jsx
<Checkbox
  id="disabled"
  name="disabled"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  label="Disabled checkbox"
  disabled={true}
/>
```

### Size Variants
```jsx
<Checkbox size="small" label="Small checkbox" />
<Checkbox size="medium" label="Medium checkbox" />
<Checkbox size="large" label="Large checkbox" />
```

### Color Variants
```jsx
<Checkbox variant="primary" label="Primary variant" />
<Checkbox variant="secondary" label="Secondary variant" />
<Checkbox variant="success" label="Success variant" />
<Checkbox variant="warning" label="Warning variant" />
<Checkbox variant="danger" label="Danger variant" />
```

## Accessibility Features

- **Keyboard Navigation**: Use Space or Enter to toggle
- **ARIA Attributes**: Proper `role`, `aria-checked`, `aria-disabled`
- **Focus Indicators**: Clear focus states for keyboard users
- **Screen Reader Support**: Proper labeling and descriptions
- **High Contrast**: Enhanced visibility in high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Styling

The component uses CSS custom properties and follows the app's design system. It automatically adapts to:

- **Dark Mode**: Automatic dark mode detection and styling
- **High Contrast**: Enhanced borders and focus states
- **Reduced Motion**: Disabled animations when preferred
- **Mobile**: Responsive design for touch interfaces

## Migration from Existing Checkboxes

To migrate from existing checkbox implementations:

**Before:**
```jsx
<label className="checkbox-label">
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => setChecked(e.target.checked)}
    className="form-checkbox"
  />
  <span className="checkbox-text">Label</span>
</label>
```

**After:**
```jsx
<Checkbox
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  label="Label"
/>
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This component is part of the PermissionsSystem application. 