# commitional

CLI tool for crafting commit messages

## Usage
**Install globally**
```bash
commitional
```

**Installed in workspace**
```bash
npx commitional
```

## Installation

### Configuration

When using the `--auto` flag, Commitional can leverage AI services to help generate commit messages. The following environment variables can be configured to use these services:

#### OpenAI Configuration

- `COMMITIONAL_OPENAI_KEY`: Your OpenAI API key
- `COMMITIONAL_OPENAI_URL`: The OpenAI API endpoint (default: https://api.openai.com/v1/chat/completions)
- `COMMITIONAL_OPENAI_PREFERENCE`: Priority level for using this service (lower numbers have higher priority, 0 disables the service)

#### Amazon Bedrock (Amplify) Configuration

- `COMMITIONAL_AMPLIFY_KEY`: Your AWS access key for Bedrock/Amplify
- `COMMITIONAL_AMPLIFY_URL`: The Amplify API endpoint
- `COMMITIONAL_AMPLIFY_PREFERENCE`: Priority level for using this service (lower numbers have higher priority, 0 disables the service)

Example configuration in your `.bashrc` or `.zshrc`:

```bash
# OpenAI configuration
export COMMITIONAL_OPENAI_KEY="your-openai-api-key"
export COMMITIONAL_OPENAI_URL="https://api.openai.com/v1"
export COMMITIONAL_OPENAI_PREFERENCE="1"  # First preference

# Amplify configuration
export COMMITIONAL_AMPLIFY_KEY="your-amplify-api-key"
export COMMITIONAL_AMPLIFY_URL="https://amplify.planittesting.com"
export COMMITIONAL_AMPLIFY_PREFERENCE="2"  # Second preference
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