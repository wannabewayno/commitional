<div align="center">
  <h1>commitional</h1>
  <p>
    <a alt="NPM Version"><img src="https://img.shields.io/npm/v/commitional?style=social&logo=npm" /></a>
    <a alt="NPM Downloads"><img src="https://img.shields.io/npm/dw/commitional?style=social&logo=npm" /></a>
    <a alt="NPM Last Update"><img src="https://img.shields.io/npm/last-update/commitional?style=social&logo=npm" /></a>
  </p>
    <p>
    <a alt="Libraries.io dependency status for GitHub repo"><img src="https://img.shields.io/librariesio/github/wannabewayno/commitional?style=plastic" /></a>
    <a alt="GitHub Issues or Pull Requests"><img src="https://img.shields.io/github/issues/wannabewayno/commitional?style=plastic&logo=github" /></a>
  </p>
</div>
CLI for crafting commit messages that adhere to configured linting rules.


> Compatible out-of-the-box with commitlint.

Use your existing commitlint config without any changes; the cli will guide and auto fix according to the rules.

> Batteries included, but removable

Hook up your favourite Gen AI Service to autogenerate commit messages based on the changes being made.
Lowers the barrier to entry for frequent, descriptive and lintable commits

## Installation
| Runtime       | Global                       | Workspace                            |
| ------------- | ---------------------------- | ------------------------------------ |
| Bun           | `bun install commitional -g` | `bun add -d commitional`             |
| Node          | `npm install commitional -g` | `npm i --save-dev commitional`       |


## Usage
| Runtime       | Global                     | Workspace                   |
| ------------- | -------------------------- | --------------------------- |
| Bun           | `commitional`              | `bunx commitional`          |
| Node          | `commitional`              | `npx commitional`           |

### CLI
**help**
use the `--help` flag to see a list of allowed subcommands and options.

### --auto Flag

When using the `--auto` flag, Commitional can leverage configured AIs to help generate commit messages.
The following environment variables can be configured to tell commitional how to access an AI Service

| Env Variable                       | Description                                                                                        | Default                        | 
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------ |
| COMMITIONAL_{{Service}}_KEY        | Your API key                                                                                       |                                |
| COMMITIONAL_{{Service}}_URL        | The base url of the service's api endpoint                                                         | Current public api endpoint    |
| COMMITIONAL_{{Service}}_PREFERENCE | Priority level for using this service (lower numbers have higher priority, 0 disables the service) | 1                              |
| COMMITIONAL_{{Service}}_MODEL     | The model identifier to use for this service                                                       | Service-specific default       |
 
**Allowed Services**
- OpenAI
- Amplify
- xAI
- Perplexity

**Example**
configuration in your `.bashrc` or `.zshrc`:

```bash
# OpenAI configuration
export COMMITIONAL_OPENAI_KEY="your-openai-api-key"
export COMMITIONAL_OPENAI_PREFERENCE="1"  # First preference
export COMMITIONAL_OPENAI_MODEL="gpt-4"   # Use GPT-4 model

# Amplify configuration
export COMMITIONAL_AMPLIFY_KEY="your-amplify-token"
export COMMITIONAL_AMPLIFY_PREFERENCE="2"  # Second preference
export COMMITIONAL_AMPLIFY_MODEL="custom-model"  # Use custom model
```

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

## Contributing

Contributions are welcome!
Please see the contributing.md guide for information on how to contribute to this project 

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.