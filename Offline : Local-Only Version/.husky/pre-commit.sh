#!/usr/bin/env sh
node update-readme.js && git add README.md && npx markdownlint-cli "*.md"