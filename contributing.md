# Contributing to Commitional
Hey there! If you would like to contribute to this project, thanks!
I'll be updating this later with the nuts and bolts on how to engage with this project.

At the moment I haven't written a contributing guide yet, but it will be on the way when I feel this is ready for outside influence.

## Development

### Prerequisites

- Node.js (v18 or higher) or Bun
- npm, yarn or bun

### Setup

1. Clone the repository
```bash
git clone https://github.com/wannabewayno/commitional.git
cd commitional
```

2. Install dependencies
```bash
# Node
npm install

# Bun
bun install
```

3. Run development mode
```bash
npm run dev
```

4. Installing the current local version globally
**Convenience script**
```bash
./install.sh
```
**Manually**
```bash
npm run build && npm install -g .
```

### Scripts
- `npm run format` - Format code using Biome
- `npm run lint` - Lint code using Biome
- `npm run check` - Check code with tsc
- `npm run build` - Bundles code with esbuild to bin/commitional.js
- `npm test` - Run tests