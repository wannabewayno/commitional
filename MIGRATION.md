# Migration Guide: Namespace Support

This guide helps you migrate to the new bracket namespace syntax introduced in commitional v1.1.0.

## What's New

### Bracket Namespace Syntax
- **Old ambiguous format**: `feat(myapp): add feature` (unclear if `myapp` is namespace or scope)
- **New clear format**: `[myapp] feat: add feature` (clearly a namespace)
- **With scope**: `[myapp] feat(auth): add login` (namespace + scope)

### File-to-Namespace Validation
- Automatically validates that commit namespaces match the files being changed
- Prevents commits that span multiple namespaces
- Supports glob patterns like `apps/*` and `libs/*`

## Migration Steps

### 1. Update Configuration

**Before:**
```yaml
# Old scope-based approach (still works)
rules:
  scope-enum: [2, 'always', ['web-app', 'mobile-app', 'shared']]
```

**After:**
```yaml
# New namespace approach
rules:
  namespace-enum: [2, 'always', ['apps/*', 'libs/*']]
  namespace-empty: [2, 'never']
  
  # Scopes are now optional and independent
  scope-enum: [0, 'always', ['auth', 'ui', 'api']]
```

### 2. Update Commit Message Format

**Before:**
```bash
# Ambiguous - is 'myapp' a namespace or scope?
git commit -m "feat(myapp): add user authentication"
```

**After:**
```bash
# Clear namespace syntax
git commit -m "[myapp] feat: add user authentication"

# Or with scope for more specificity
git commit -m "[myapp] feat(auth): add user authentication"
```

### 3. Organize Your Repository

Structure your monorepo to work with namespace patterns:

```
my-monorepo/
├── apps/
│   ├── web-app/          # → namespace: web-app
│   ├── mobile-app/       # → namespace: mobile-app
│   └── admin-dashboard/  # → namespace: admin-dashboard
├── libs/
│   ├── shared-ui/        # → namespace: shared-ui
│   ├── api-client/       # → namespace: api-client
│   └── utils/            # → namespace: utils
└── README.md             # → no namespace required
```

## Backward Compatibility

### Existing Commits
- All existing commits continue to work unchanged
- No need to rewrite git history
- Traditional `type(scope): subject` format still supported

### Gradual Migration
You can migrate gradually:

1. **Phase 1**: Add namespace rules alongside existing scope rules
2. **Phase 2**: Start using bracket syntax for new commits
3. **Phase 3**: Eventually deprecate old scope-based namespace patterns

### Mixed Usage
Both formats can coexist:

```yaml
rules:
  # New namespace rules
  namespace-enum: [2, 'always', ['apps/*', 'libs/*']]
  namespace-empty: [2, 'never']
  
  # Keep existing scope rules for backward compatibility
  scope-enum: [1, 'always', ['auth', 'ui', 'api', 'legacy-app']]
```

## Common Migration Patterns

### Pattern 1: Scope to Namespace
**Before:**
```
feat(web-app): add login page
fix(mobile-app): resolve crash on startup
```

**After:**
```
[web-app] feat: add login page
[mobile-app] fix: resolve crash on startup
```

### Pattern 2: Nested Scopes to Namespace + Scope
**Before:**
```
feat(web-app-auth): implement OAuth
fix(mobile-app-ui): update button styles
```

**After:**
```
[web-app] feat(auth): implement OAuth
[mobile-app] fix(ui): update button styles
```

### Pattern 3: Mixed Changes to Separate Commits
**Before:**
```
feat: update shared components and web app
```

**After:**
```
[shared-ui] feat: update button component
[web-app] feat: integrate new button component
```

## Validation Benefits

### Before Migration
- Manual enforcement of namespace conventions
- Risk of commits spanning multiple applications
- Unclear separation between namespaces and scopes

### After Migration
- Automatic validation of file-to-namespace alignment
- Prevention of multi-namespace commits
- Clear distinction between namespaces and scopes
- Better monorepo workflow enforcement

## Troubleshooting

### Common Issues

**Issue**: `Files in apps/myapp require namespace "myapp"`
**Solution**: Add namespace to commit message: `[myapp] feat: your message`

**Issue**: `Commit spans multiple namespaces: web-app, shared-ui`
**Solution**: Split into separate commits for each namespace

**Issue**: `Files not apart of namespace "myapp"`
**Solution**: Remove namespace for root files: `docs: update README`

### Getting Help

1. Check the [examples](./examples/) directory for configuration templates
2. Review [commit-examples.md](./examples/commit-examples.md) for message formats
3. Run `commitional lint --help` for command options

## Benefits of Migration

1. **Clarity**: Clear distinction between namespaces and scopes
2. **Validation**: Automatic enforcement of monorepo conventions
3. **Flexibility**: Independent namespace and scope configuration
4. **Maintainability**: Better organization of large codebases
5. **Team Alignment**: Consistent commit message patterns across teams