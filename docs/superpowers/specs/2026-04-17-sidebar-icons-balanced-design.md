# Balanced Sidebar Icon Pass

## Goal

Improve the dashboard sidebar so it feels more intentional and easier to scan by adding icons and modest hierarchy improvements without changing routing, information architecture, or the overall app tone.

## Scope

In scope:
- Add a `lucide-react` icon to each sidebar destination
- Strengthen the sidebar header with a small brand mark and supporting text
- Improve spacing and visual hierarchy between the primary action and the admin section
- Preserve desktop and mobile behavior, active-state logic, and existing labels

Out of scope:
- Route changes
- New sidebar sections
- New colors or a new design system
- Collapsed-icon-only behavior changes

## Chosen Approach

Use a balanced visual pass:
- Keep the current two-group structure
- Add small monochrome icons aligned with each label
- Treat `Generate` as the primary destination through stronger spacing and slightly clearer emphasis
- Upgrade the `ParcelFlow` header into a simple brand block with an icon and a quiet supporting line

This keeps the sidebar cleaner and more legible without making it visually heavier than the rest of the app.

## Navigation Design

### Brand block

Replace the current plain text header with:
- a small icon mark
- `ParcelFlow` as the product label
- a short supporting line such as `Image operations`

The block should remain compact and use the existing sidebar colors.

### Primary link

`Generate` stays in the top group and becomes the clearest first action in the sidebar. It will get:
- an icon
- slightly better separation from the brand block
- the existing active-state treatment

### Admin section

The admin section keeps the same label and the same destination list. Each item gets:
- an icon
- consistent spacing with the label
- no custom badges or extra metadata

## Icon Mapping

Recommended icon set:
- `Generate` → `Sparkles`
- `Products` → `Package`
- `Colours / RAL` → `Palette`
- `Countries` → `Globe`
- `Shot Types` → `Camera`
- `Installation Types` → `Wrench`
- `Prompt Templates` → `FileText`
- `Prompt Overrides` → `SlidersHorizontal`
- brand mark → `PanelsTopLeft` or similarly simple layout/product icon

Icons should use the sidebar text color, remain small, and not compete with labels.

## Implementation Notes

- Update `src/components/layout/AppSidebar.tsx`
- Keep `SidebarMenuButton` as the navigation primitive
- Continue passing active state through the existing `isActive` logic
- Add icons as children inside each menu button before the label text
- Keep the link render strategy compatible with the generated shadcn sidebar component already in the repo

## Testing

Add or update component tests to verify:
- the main navigation links still render with the correct labels and hrefs
- the new icon-bearing buttons still preserve active state behavior
- the header still renders expected text after the brand block update

## Risks

- The generated shadcn sidebar uses a Base UI render API, so icon insertion should follow the current button composition rather than older `asChild` examples
- Tests should continue to avoid depending on SVG internals beyond presence and accessible text context
