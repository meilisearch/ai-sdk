# Contributing

First of all, thank you for contributing to Meilisearch! The goal of this document is to provide everything you need to know in order to contribute to this project.

## Coding with AI

We accept the use of AI-powered tools (GitHub Copilot, ChatGPT, Claude, Cursor, etc.) for contributions, whether for code, tests, or documentation.

⚠️ However, transparency is required: if you use AI assistance, please mention it in your PR description. This helps maintainers during code review and ensure the quality of contributions.

What we expect:

- **Disclose AI usage**: A simple note like "Used GitHub Copilot for autocompletion" or "Generated initial test structure with ChatGPT" is sufficient.
- **Specify the scope**: Indicate which parts of your contribution involved AI assistance.
- **Review AI-generated content**: Ensure you understand and have verified any AI-generated code before submitting.

## Assumptions

1. **You're familiar with [GitHub](https://github.com) and the [Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests) (PR) workflow.**
2. **You've read the Meilisearch [documentation](https://www.meilisearch.com/docs) and the [README](/README.md).**
3. **You know about the [Meilisearch community](https://discord.com/invite/meilisearch). Please use this for help.**

## How to Contribute

1. Make sure that the contribution you want to make is explained or detailed in a GitHub issue! Find an [existing issue](https://github.com/meilisearch/ai-sdk/issues/) or [open a new one](https://github.com/meilisearch/ai-sdk/issues/new).
2. Once done, [fork the ai-sdk repository](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) in your own GitHub account. Ask a maintainer if you want your issue to be checked before making a PR.
3. [Create a new Git branch](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository).
4. Review the [Development Workflow](#development-workflow) section that describes the steps to maintain the repository.
5. Make your changes on your branch. If you use AI tools during your work, remember to disclose it in your PR description (see [Coding with AI](#coding-with-ai)).
6. [Submit the branch as a PR](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) pointing to the `main` branch of the main ai-sdk repository. A maintainer should comment and/or review your Pull Request within a few days. Although depending on the circumstances, it may take longer.<br>
   We do not enforce a naming convention for the PRs, but **please use something descriptive of your changes**.

## Development Workflow

### Requirements

To run this project, you will need:

- [Vite+](https://viteplus.dev/guide/) (`vp` binary) — install with `curl -fsSL https://vite.plus | bash`

### Setup

To install dependencies:

```bash
vp install
```

### Tests and checks

Each PR should pass the tests and checks to be accepted.

```bash
# Tests
vp test
# Format, lint, and types
vp check
# Build the project
vp pack
```

## Git Guidelines

### Git Branches

All changes must be made in a branch and submitted as PR.
We do not enforce any branch naming style, but please use something descriptive of your changes.

We don't enforce any git commit convention, but we recommend following [this one](https://chris.beams.io/posts/git-commit/).

### GitHub Pull Requests

Some notes on GitHub PRs:

- [Convert your PR as a draft](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/changing-the-stage-of-a-pull-request) if your changes are a work in progress: no one will review it until you pass your PR as ready for review.<br>
  The draft PR can be very useful if you want to show that you are working on something and make your work visible.
- The branch related to the PR must be **up-to-date with `main`** before merging.
- All PRs must be reviewed and approved by at least one maintainer.
- The PR title should be accurate and descriptive of the changes.

---

Thank you again for reading this through. We can not wait to begin to work with you if you make your way through this contributing guide ❤️
