# Commit Message Examples with Namespace Support

This document provides examples of commit messages using the new bracket namespace syntax.

## Basic Namespace Examples

### Namespace Only
```
[myapp] feat: add user authentication
[shared] fix: resolve memory leak in cache
[admin] docs: update API documentation
```

### Namespace with Scope
```
[myapp] feat(auth): implement OAuth2 login
[shared] fix(cache): resolve memory leak
[admin] style(ui): update button colors
```

### Traditional Format (Backward Compatible)
```
feat(utils): add string helper functions
fix(api): handle null response
docs: update installation guide
```

## Monorepo Structure Examples

For a monorepo with this structure:
```
├── apps/
│   ├── web-app/
│   ├── mobile-app/
│   └── admin-dashboard/
├── libs/
│   ├── shared-ui/
│   ├── api-client/
│   └── utils/
├── tools/
│   └── build-scripts/
└── README.md
```

### Valid Commit Messages

**Files in `apps/web-app/`:**
```
[web-app] feat: add shopping cart
[web-app] feat(checkout): implement payment flow
[web-app] fix(ui): resolve mobile layout issues
```

**Files in `libs/shared-ui/`:**
```
[shared-ui] feat: add new button component
[shared-ui] fix(modal): resolve z-index issues
[shared-ui] style: update color palette
```

**Files in `tools/build-scripts/`:**
```
[build-scripts] feat: add webpack optimization
[build-scripts] fix: resolve TypeScript compilation
```

**Root files:**
```
docs: update README
chore: update dependencies
ci: add GitHub Actions workflow
```

## Invalid Examples (Will Be Rejected)

### Missing Required Namespace
```
❌ feat: add user auth
   (for files in apps/web-app/)

✅ [web-app] feat: add user auth
```

### Wrong Namespace
```
❌ [mobile-app] feat: add web feature
   (for files in apps/web-app/)

✅ [web-app] feat: add web feature
```

### Multiple Namespaces
```
❌ [web-app] feat: update shared components
   (when files span apps/web-app/ and libs/shared-ui/)

✅ Split into separate commits:
   [web-app] feat: integrate new components
   [shared-ui] feat: add new components
```

### Namespace for Root Files
```
❌ [web-app] docs: update README
   (for root README.md file)

✅ docs: update README
```

## Configuration Examples

### Basic Monorepo Config
```yaml
rules:
  namespace-enum: [2, 'always', ['apps/*', 'libs/*']]
  namespace-empty: [2, 'never']
```

### Advanced Config with Multiple Patterns
```yaml
rules:
  namespace-enum: 
    - 2
    - always
    - [
        'apps/*',
        'libs/*', 
        'tools/*',
        'packages/*'
      ]
  namespace-empty: [2, 'never']
  
  # Optional: Require specific scopes per namespace
  scope-enum:
    - 2
    - always
    - ['auth', 'ui', 'api', 'db', 'cache', 'config']
```

## Best Practices

1. **Keep namespaces short**: Use `[ui]` instead of `[user-interface]`
2. **Be consistent**: Use the same namespace for related files
3. **One namespace per commit**: Don't mix changes across namespaces
4. **Use scopes for specificity**: `[myapp] feat(auth): ...` is better than `[myapp] feat: add auth stuff`
5. **Root files don't need namespaces**: Keep `docs:`, `chore:`, `ci:` commits simple