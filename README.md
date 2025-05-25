# commitional

CLI tool for crafting commit messages

## Usage
```bash
commitional
```

## Development

### Prerequisites

- Node.js (v18 or higher) or Bun
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/commitional.git
cd commitional
```

2. Install dependencies
```bash
# Bun
npm install

# Node
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

## Contributing

Contributions are welcome!
Please see the contributing.md guide for information on how to contribute to this project 

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.