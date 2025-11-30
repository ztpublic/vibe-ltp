# Migrate from react-chatbot-kit Library to Local Source Code

## Overview

Migrate the chatbot UI implementation from using the external `react-chatbot-kit` npm package to directly using its cloned source code located in `packages/react-chatbot-kit`. This enables unrestricted customization of the chatbot UI without library constraints.

## Background

The project currently uses `react-chatbot-kit` version 2.2.2 as an external dependency to implement the chat interface. As UI requirements evolve and deviate significantly from the library's defaults, maintaining the library as an external dependency creates friction. The source code has been cloned into the monorepo at `packages/react-chatbot-kit`, allowing direct modification.

## Goals

1. Remove the external `react-chatbot-kit` dependency from the web application
2. Reference the local source code package instead
3. Maintain all existing functionality without regression
4. Enable future UI customizations by making the cloned code fully editable
5. Ensure CSS overrides continue to work correctly

## Non-Goals

- Refactoring or redesigning the chatbot UI architecture
- Modifying the existing chatbot behavior or features
- Changing the component API or interfaces used by consuming code

## Current Integration Points

The application integrates with `react-chatbot-kit` at the following locations:

| File | Import Statement | Usage |
|------|------------------|-------|
| `apps/web/src/features/chatbot/config.tsx` | `import { createChatBotMessage } from 'react-chatbot-kit'` | Creates bot message objects |
| `apps/web/src/features/chatbot/index.tsx` | `import Chatbot from 'react-chatbot-kit'` | Main chatbot component |
| `apps/web/src/features/chatbot/index.tsx` | `import 'react-chatbot-kit/build/main.css'` | Library CSS styles |
| `apps/web/stories/ChatbotWithReplyLabels.stories.tsx` | `import Chatbot from 'react-chatbot-kit'` | Storybook stories |
| `apps/web/stories/ChatbotWithReplyLabels.stories.tsx` | `import { createChatBotMessage, createClientMessage } from 'react-chatbot-kit'` | Storybook utility functions |
| `apps/web/stories/ChatbotWithReplyLabels.stories.tsx` | `import 'react-chatbot-kit/build/main.css'` | Storybook CSS |

## Local Package Structure

The cloned source code at `packages/react-chatbot-kit` has the following structure:

```
packages/react-chatbot-kit/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   ├── Chatbot/
│   │   ├── ChatbotError/
│   │   ├── ChatbotMessage/
│   │   ├── Loader/
│   │   ├── UserChatMessage/
│   │   └── WidgetRegistry/
│   ├── hooks/
│   │   └── useChatbot.ts
│   ├── interfaces/
│   │   ├── IConfig.ts
│   │   ├── IMessages.ts
│   │   ├── IWidget.ts
│   │   └── custom.d.ts
│   ├── assets/
│   └── index.ts (main export)
├── package.json
├── tsconfig.json
└── webpack.config.js
```

The main exports from `src/index.ts`:
- `Chatbot` (default export)
- `createChatBotMessage`
- `createClientMessage`
- `createCustomMessage`
- `useChatbot`

## Migration Strategy

### Phase 1: Package Configuration

**Objective**: Configure the local package as a workspace dependency.

1. **Update Local Package Configuration**
   - Modify `packages/react-chatbot-kit/package.json`:
     - Change package name from `react-chatbot-kit` to `@vibe-ltp/react-chatbot-kit`
     - Add TypeScript build configuration
     - Ensure peer dependencies are properly declared (React 18.x)
     - Add workspace-compatible build scripts if needed

2. **Configure Build System**
   - Ensure TypeScript compilation settings in `packages/react-chatbot-kit/tsconfig.json` are compatible with the monorepo
   - Verify CSS handling strategy (inline imports or separate build step)
   - Confirm webpack build outputs are suitable for local consumption

3. **Add Workspace Dependency**
   - Update `apps/web/package.json` to add `"@vibe-ltp/react-chatbot-kit": "workspace:*"` to dependencies
   - Remove the external `"react-chatbot-kit": "^2.2.2"` dependency

### Phase 2: Update Import Statements

**Objective**: Replace all external package imports with local package references.

1. **Update Application Code**
   - In `apps/web/src/features/chatbot/config.tsx`: Change `from 'react-chatbot-kit'` to `from '@vibe-ltp/react-chatbot-kit'`
   - In `apps/web/src/features/chatbot/index.tsx`: Change `from 'react-chatbot-kit'` to `from '@vibe-ltp/react-chatbot-kit'`

2. **Update Storybook Code**
   - In `apps/web/stories/ChatbotWithReplyLabels.stories.tsx`: Update both import statements to use `'@vibe-ltp/react-chatbot-kit'`

3. **Update CSS Imports**
   - Strategy depends on how the local package exposes CSS:
     - Option A: If CSS is bundled with the package, import from `'@vibe-ltp/react-chatbot-kit/build/main.css'` or similar
     - Option B: If CSS is kept separate, import directly from source path `'@vibe-ltp/react-chatbot-kit/src/components/**/*.css'`
   - Update in both `apps/web/src/features/chatbot/index.tsx` and Storybook story files
   - Maintain correct import order: library CSS first, then `globals.css` (ensures `!important` overrides work correctly)

### Phase 3: CSS Override Verification

**Objective**: Ensure all custom style overrides in `globals.css` continue to work.

The application has extensive CSS overrides in `apps/web/app/globals.css` that customize:
- Container dimensions and background colors
- Input styling and focus states
- Message alignment and colors
- Header styling
- Button states

**Validation Requirements**:
- All CSS class names remain unchanged in the local package
- The specificity hierarchy is maintained
- `!important` rules continue to override library defaults
- Both app and Storybook render with correct styling

### Phase 4: Dependency Management

**Objective**: Clean up and verify package dependencies.

1. **Remove External Dependency**
   - Run `pnpm remove react-chatbot-kit` in `apps/web`
   - Verify removal from package-lock files

2. **Install Local Package**
   - Run `pnpm install` at workspace root to link the local package
   - Verify symlink creation in `node_modules/@vibe-ltp/react-chatbot-kit`

3. **Verify Transitive Dependencies**
   - Check that `react-conditionally-render` (used by chatbot package) is available
   - Ensure no missing peer dependency warnings

### Phase 5: Build and Runtime Verification

**Objective**: Confirm the migration works in all environments.

1. **Type Checking**
   - Run `pnpm typecheck` in `apps/web` to verify TypeScript compilation
   - Ensure no type resolution errors from the local package
   - Confirm all exported types are accessible

2. **Development Server**
   - Start the dev server with `pnpm dev`
   - Verify the chatbot renders correctly
   - Test all chatbot interactions:
     - Sending messages
     - Receiving bot responses
     - Message history restoration
     - Nickname display
     - Reply threading
     - Socket.IO integration

3. **Storybook**
   - Run `pnpm storybook` in `apps/web`
   - Verify all chatbot stories render correctly
   - Test interactive story behaviors

4. **Production Build**
   - Run `pnpm build` in `apps/web`
   - Verify no build errors related to the chatbot package
   - Check bundle size impact (should be similar or slightly smaller)

## Technical Considerations

### TypeScript Configuration

The local package must properly export type definitions. Ensure:
- `tsconfig.json` has `"declaration": true` to generate `.d.ts` files
- Main entry point references the correct types via `"types"` field in `package.json`
- All interfaces and types are properly exported

### CSS Bundling

Two possible approaches for CSS handling:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Pre-built CSS** | Keep webpack build that outputs `build/main.css` | Matches original library behavior, simple import | Requires build step, less flexible |
| **Direct CSS imports** | Import CSS files directly from `src/` | No build step for CSS, easier to customize | May require bundler configuration |

**Recommended**: Maintain the pre-built CSS approach initially to minimize migration risk. The webpack config already exists and produces `build/main.css`.

### Monorepo Workspace Integration

The package should integrate cleanly with the pnpm workspace:
- Use `workspace:*` protocol for internal dependencies
- Respect workspace hoisting for shared dependencies
- Ensure `tsconfig.json` extends from workspace base config if applicable

### Component API Compatibility

Critical that the migration maintains exact API compatibility:

```typescript
// Must continue to work identically
import Chatbot from '@vibe-ltp/react-chatbot-kit';
import { createChatBotMessage, createClientMessage } from '@vibe-ltp/react-chatbot-kit';

// Component props interface must remain unchanged
<Chatbot
  config={config}
  messageParser={MessageParser}
  actionProvider={ActionProvider}
  placeholderText="..."
  validator={...}
/>
```

## Testing Strategy

### Functional Testing

1. **Manual Testing Checklist**
   - [ ] Chatbot component renders on homepage
   - [ ] User can type and send messages
   - [ ] Bot responses appear correctly
   - [ ] Nickname badges display properly
   - [ ] Reply threading shows correct context
   - [ ] Message history persists across page refresh
   - [ ] Socket.IO connection establishes successfully
   - [ ] All custom components render (NicknameBadge, PuzzleBotMessage, PuzzleUserMessage)

2. **Visual Regression Testing**
   - Compare screenshots before and after migration
   - Verify all CSS overrides apply correctly
   - Check responsive behavior (40vw width, 100vh height)
   - Validate dark theme colors

3. **Storybook Verification**
   - All existing stories render without errors
   - Interactive controls work correctly
   - Story visual output matches previous version

### Integration Testing

Verify integration with existing systems:
- Socket.IO message broadcasting
- Chat service API calls
- Identity/nickname management
- Game state synchronization

## Rollback Plan

If critical issues arise during migration:

1. **Immediate Rollback**
   - Revert changes to `apps/web/package.json`
   - Restore `"react-chatbot-kit": "^2.2.2"` dependency
   - Revert import statement changes
   - Run `pnpm install` to restore external package

2. **Preserve Local Package**
   - Keep `packages/react-chatbot-kit` directory intact
   - Can retry migration after resolving issues

## Success Criteria

The migration is considered successful when:

1. ✅ External `react-chatbot-kit` dependency is removed from `apps/web/package.json`
2. ✅ All imports reference `@vibe-ltp/react-chatbot-kit`
3. ✅ Application builds without errors
4. ✅ All chatbot functionality works identically to pre-migration behavior
5. ✅ CSS styling matches exactly (no visual regressions)
6. ✅ Storybook stories render correctly
7. ✅ Type checking passes without errors
8. ✅ No runtime console errors related to the chatbot
9. ✅ Production build completes successfully

## Future Enhancements

Once migration is complete, the local package enables:

- Direct modification of component structure and layout
- Custom styling without `!important` overrides
- Addition of new features specific to the application
- Removal of unused components to reduce bundle size
- Integration of application-specific logic into core components
- Simplified debugging with full source code access

## References

- Original library: https://github.com/FredrikOseberg/react-chatbot-kit
- Local package location: `/packages/react-chatbot-kit`
- Application integration: `/apps/web/src/features/chatbot`
