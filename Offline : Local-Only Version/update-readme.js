// /Users/theepireddykarthikreddy/AutoMarkDown/update-readme.js

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const README_PATH = path.join(__dirname, 'README.md');
const DOCS_START_MARKER = '<!-- AUTO-DOCS-START -->';
const DOCS_END_MARKER = '<!-- AUTO-DOCS-END -->';

async function main() {
  // Find all .js files in the 'src' directory (adjust if your code is elsewhere)
  const files = await glob('**/*.js', {
    ignore: ['node_modules/**', 'init-docs.js', 'update-readme.js'],
  });

  // For each file, find its dependencies
  const fileDetails = await Promise.all(
    files.map(async file => {
      const content = fs.readFileSync(file, 'utf8');
      // Regex to find non-relative imports/requires (e.g., 'firebase', not './firebase')
      const dependencyRegex = /(?:require|from)\(['"]([^./][^'"]*)['"]/g;
      const dependencies = new Set();
      let match;
      while ((match = dependencyRegex.exec(content)) !== null) {
        dependencies.add(match[1]);
      }
      return { path: file, dependencies: Array.from(dependencies) };
    })
  );

  // Generate the markdown content for the file and dependency list
  const fileListMarkdown = fileDetails
    .map(detail => {
      const deps = detail.dependencies.map(d => `\`${d}\``).join(', ');
      return `- \`${detail.path}\`${deps ? `\n  - **Dependencies**: ${deps}` : ''}`;
    })
    .join('\n');

  const generatedContent = `
## Project Files

This list is automatically generated. Do not edit it manually.

${fileListMarkdown}
  `.trim();

  // Read the existing README
  let readmeContent;
  try {
    readmeContent = fs.readFileSync(README_PATH, 'utf8');
  } catch (err) {
    console.error('README.md not found. Creating a new one.');
    // If README doesn't exist, create a template for it
    readmeContent = `# My Project\n\n${DOCS_START_MARKER}\n\n${DOCS_END_MARKER}\n`;
  }


  const newReadmeContent = readmeContent.replace(
    new RegExp(`${DOCS_START_MARKER}[\\s\\S]*${DOCS_END_MARKER}`),
    `${DOCS_START_MARKER}\n${generatedContent}\n${DOCS_END_MARKER}`
  );

  // Write the new content back to the README
  fs.writeFileSync(README_PATH, newReadmeContent);

  console.log('✅ README.md has been updated successfully.');
}

main().catch(err => {
  console.error('Error updating README.md:', err);
  process.exit(1);
});
