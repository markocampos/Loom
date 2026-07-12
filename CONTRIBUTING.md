# Contributing to Loom

Thank you for your interest in contributing to Loom! This document provides guidelines and information for contributors.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [GitHub Issues](https://github.com/user/loom/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the behavior
   - Expected behavior
   - Actual behavior
   - Your environment (browser, OS, device)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the `enhancement` label
3. Describe the feature, why it's needed, and how it should work

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run the linter (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/loom.git
cd loom

# Install dependencies
npm install

# Start development server
npm run dev
```

## Code Style

- Use Vue 3 Composition API (`<script setup>`)
- Follow the existing code structure
- Use TailwindCSS for styling
- Keep components small and focused
- Write meaningful variable and function names

## Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters
- Reference issues when applicable

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Questions?

Feel free to open an issue for any questions about contributing!
