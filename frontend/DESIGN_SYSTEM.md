# 🎨 PROD PILOT Design System

## Color Palette

### Base Colors
- **Background**: `#0F172A` (Deep Navy)
- **Card Background**: `#1E293B` (Slate)
- **Border**: `rgba(255, 255, 255, 0.05)`

### Brand Colors
- **Primary**: `#6366F1` (Electric Indigo)
- **Secondary**: `#8B5CF6` (Purple)
- **Gradient**: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)`

### Data Visualization
- **Positive**: `#22C55E` (Green)
- **Neutral**: `#F59E0B` (Amber)
- **Negative**: `#EF4444` (Red)

### Text Colors
- **Primary Text**: `#E2E8F0`
- **Secondary Text**: `#94A3B8`
- **Muted Text**: `#64748B`

## Typography
- **Font Family**: Inter
- **Headings**: 600 weight
- **Body**: 400 weight
- **Metrics**: 700 weight

## Components

### Health Score Glow Effects
- **Score > 70**: Green glow with `text-shadow: 0 0 20px rgba(34, 197, 94, 0.5)`
- **Score 40-70**: Amber glow with `text-shadow: 0 0 20px rgba(245, 158, 11, 0.5)`
- **Score < 40**: Red glow with `text-shadow: 0 0 20px rgba(239, 68, 68, 0.5)`

### Cards
- **Background**: `#1E293B`
- **Border**: `1px solid rgba(255, 255, 255, 0.05)`
- **Border Radius**: `16px`
- **Shadow**: `0 8px 30px rgba(0, 0, 0, 0.4)`
- **Hover**: `transform: translateY(-5px)` + enhanced shadow

### Buttons
- **Primary**: Gradient background with glow
- **Hover**: Lift effect with enhanced shadow
- **Active**: Return to original position

## Layout
- **Max Width**: 1400px
- **Padding**: 3rem
- **Grid Gap**: 2rem
- **Card Padding**: 2rem

## Animations
- **Fade In**: 0.5s ease-in on page load
- **Slide Up**: 0.5s ease-out for auth cards
- **Hover Transitions**: 0.3s ease for all interactive elements

## Micro UX Enhancements
✅ Smooth fade-in on load
✅ Hover elevation on cards
✅ Gradient glow effects
✅ Loading spinner
✅ Error states
✅ Responsive design
