#!/usr/bin/env node

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// --- Main execution wrapper to handle dynamic imports ---
(async () => {
    // Dynamically import ESM modules like 'ora' and 'chalk'
    const { default: ora } = await import('ora');
    const { default: chalk } = await import('chalk');

    // --- Yargs CLI Configuration ---
    const argv = yargs(hideBin(process.argv))
      .command('generate <path>', 'Generate documentation for a project at the given path', (yargs) => {
        return yargs.positional('path', {
          describe: 'Path to the project directory',
          type: 'string',
        });
      })
      .demandCommand(1, 'You must provide the "generate" command.')
      .help()
      .argv;

    // --- Initialize AI Model ---
    if (!process.env.GEMINI_API_KEY) {
      console.error(chalk.red('❌ Error: GEMINI_API_KEY not found in .env file.'));
      process.exit(1);
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- Main Logic ---
    async function main(targetDir) {
      const spinner = ora();
      try {
        spinner.start(chalk.blue('1. Analyzing project structure and reading key files...'));
        const context = await analyzeProject(targetDir);
        spinner.succeed(chalk.green('Project analysis complete.'));

        spinner.start(chalk.blue('2. Generating documentation with Gemini... (this may take a moment)'));
        const generatedDocs = await generateDocsWithRetry(context, spinner);
        spinner.succeed(chalk.green('Documentation generated successfully.'));

        spinner.start(chalk.blue('3. Saving documentation files...'));
        await saveDocs(targetDir, generatedDocs);
        spinner.succeed(chalk.green('Files saved.'));

        console.log(chalk.bold.yellow('\n✨ All done! Your new docs are in the "docs" folder.'));

      } catch (error) {
        spinner.fail(chalk.red('An unrecoverable error occurred.'));
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    }

    // --- Helper Functions ---

    // **CRITICAL UPDATE: This function now reads file contents**
    async function analyzeProject(directory) {
      const context = {
        tech: 'Unknown',
        projectName: path.basename(directory),
        dependencies: null,
        scripts: null,
        fileTree: '',
        fileContents: [] // New property to hold file contents
      };

      const ignored = new Set(['node_modules', '.git', '.vscode', 'dist', 'build', 'package-lock.json']);
      context.fileTree = await buildFileTree(directory, '', ignored);
      
      const rootFiles = await fs.readdir(directory);
      if (rootFiles.includes('package.json')) {
        context.tech = 'Node.js/JavaScript';
        const pkgJsonPath = path.join(directory, 'package.json');
        const pkgJsonContent = await fs.readFile(pkgJsonPath, 'utf8');
        const pkgJson = JSON.parse(pkgJsonContent);
        context.projectName = pkgJson.name || context.projectName;
        context.dependencies = Object.keys(pkgJson.dependencies || {});
        context.scripts = pkgJson.scripts || null;
      }
      // Add other tech stack detections here if needed

      // **NEW: Read content of key files**
      const keyFilesToRead = ['vite.config.js', 'src/main.jsx', 'src/App.jsx', 'src/components/Header.jsx', 'src/components/Cart.jsx'];
      for (const file of keyFilesToRead) {
          try {
              const filePath = path.join(directory, file);
              const content = await fs.readFile(filePath, 'utf8');
              context.fileContents.push({ path: file, content: content.substring(0, 2000) }); // Limit content size
          } catch (err) {
              // Ignore if file doesn't exist
          }
      }
      
      return context;
    }

    async function buildFileTree(dir, prefix = '', ignored, depth = 0, maxDepth = 3) {
        if (depth > maxDepth) return '';
        let tree = '';
        try {
            const files = await fs.readdir(dir, { withFileTypes: true });
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (ignored.has(file.name)) continue;

                const isLast = i === files.length - 1;
                tree += `${prefix}${isLast ? '└── ' : '├── '}${file.name}\n`;

                if (file.isDirectory()) {
                    const newPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
                    tree += await buildFileTree(path.join(dir, file.name), newPrefix, ignored, depth + 1, maxDepth);
                }
            }
        } catch (error) {
            // Suppress errors for non-existent directories during recursive scan
        }
        return tree;
    }

    async function generateDocsWithRetry(context, spinner, maxRetries = 5) {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await generateDocs(context);
        } catch (error) {
          const errorMessage = error.message || '';
          if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
            attempt++;
            if (attempt >= maxRetries) {
              throw new Error('The model is overloaded and all retry attempts have failed. Please try again later.');
            }
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            spinner.warn(chalk.yellow(`Model is overloaded. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt}/${maxRetries})`));
            await new Promise(resolve => setTimeout(resolve, delay));
            spinner.start(chalk.blue('Retrying to generate documentation...'));
          } else {
            throw error;
          }
        }
      }
    }
    
    // **CRITICAL UPDATE: The prompt is now much more detailed**
    async function generateDocs(context) {
        const fileContentsString = context.fileContents.map(file => `
--- File: ${file.path} ---
\`\`\`
${file.content}
\`\`\`
`).join('\n');

        const prompt = `
        You are an elite technical writer creating onboarding documentation for a software project. Your analysis must be deep and specific, based on the file contents provided. Do not make generic statements; infer logic directly from the code.

        **Project Analysis:**
        - **Project Name:** ${context.projectName || 'N/A'}
        - **Technology Stack:** ${context.tech}
        - **Key Dependencies:** ${context.dependencies ? context.dependencies.join(', ') : 'N/A'}
        - **Available Scripts (from package.json):** ${context.scripts ? JSON.stringify(context.scripts, null, 2) : 'N/A'}
        - **Project File Structure:**
          \`\`\`
          ${context.fileTree}
          \`\`\`
        - **Key File Contents:**
          ${fileContentsString}

        **Instructions:**
        Generate the content for four files: \`README.md\`, \`SETUP.md\`, \`ARCHITECTURE.md\`, and \`CONTRIBUTING.md\`. Your analysis must be directly tied to the code in "Key File Contents".

        1.  **For \`README.md\`:** Write a detailed project README. Explain the project's purpose and features by referencing specific components found in the code.
        2.  **For \`SETUP.md\`:** A detailed, step-by-step setup guide. Mention any environment variables that might be needed based on the code (e.g., if you see \`process.env.VITE_API_URL\`).
        3.  **For \`ARCHITECTURE.md\`:** This is the most important part. Analyze the provided code to describe the architecture. Explain the role of \`main.jsx\` and \`App.jsx\`. Detail the routing structure if \`react-router-dom\` is used. Explain the purpose of key components like \`Header.jsx\` and \`Cart.jsx\` based on their actual code. If you see \`axios\` or \`fetch\`, describe the data fetching patterns and infer the API endpoints being used.
        4.  **For \`CONTRIBUTING.md\`:** A standard contributing guide, but add a small section on the project's specific coding style if you can infer it from the provided JSX/JS code.

        **Output Format:**
        Use the exact separators for each file. Do not add any text outside this structure.

        [START_README.md]
        (Content for README.md goes here)
        [END_README.md]

        [START_SETUP.md]
        (Content for SETUP.md goes here)
        [END_SETUP.md]

        [START_ARCHITECTURE.md]
        (Content for ARCHITECTURE.md goes here)
        [END_ARCHITECTURE.md]

        [START_CONTRIBUTING.md]
        (Content for CONTRIBUTING.md goes here)
        [END_CONTRIBUTING.md]
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    async function saveDocs(targetDir, docText) {
      const docsDir = path.join(targetDir, 'docs');
      await fs.mkdir(docsDir, { recursive: true });
      const docRegex = /\[START_([\w.-]+)\]([\s\S]*?)\[END_\1\]/g;
      let match;
      let filesSaved = 0;
      while ((match = docRegex.exec(docText)) !== null) {
        const fileName = match[1];
        const content = match[2].trim();
        await fs.writeFile(path.join(docsDir, fileName), content);
        filesSaved++;
      }
      if (filesSaved === 0) {
        const { default: chalk } = await import('chalk');
        console.warn(chalk.yellow('Warning: Could not find any valid document blocks in the AI response.'));
      }
    }

    // --- Run the main function ---
    if (argv.path) {
      main(argv.path);
    }

})();
