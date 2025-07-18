// ===== New init-docs.js =====

const admin = require('firebase-admin');
const fs = require('fs');

// --- 1. Initialize Firebase Admin SDK ---
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
console.log('Successfully connected to Firebase.');

// --- 2. Define the content for the main README file ---
const readmeContent = `
# AutoMarkDown Project

This file provides the core onboarding documentation for this project.
It is automatically updated with checklists when new files are added.

---

# Project Setup Guide

## Prerequisites

- Node.js (v18 or later)
- npm

## Installation

1. Clone the repository: \`git clone <repository-url>\`
2. Install dependencies: \`npm install\`

## Running the Project

- To start the development server, run: \`npm start\`

---

# Coding Standards

## JavaScript

- Use camelCase for variables and functions.
- End all statements with a semicolon.
- Use single quotes for strings.

## Markdown

- Use a single top-level heading (#).
- Use subheadings (##, ###) to structure content.

---
<!-- AUTO-DOCS-START -->
## Project Files

This list is automatically generated. Do not edit it manually.
<!-- AUTO-DOCS-END -->
`.trim() + '\n'; // Use trim() and add a single newline for correct formatting

/**
 * Main function to create the initial README and upload it.
 */
async function initializeProjectReadme() {
  console.log('--- Starting Project Initialization ---');

  try {
    // --- Create the local README.md file ---
    fs.writeFileSync('README.md', readmeContent);
    console.log('✅ Successfully generated local README.md');

    // --- Upload the initial README to Firestore ---
    const docRef = db.collection('onboarding-docs').doc('README');
    await docRef.set({
      content: readmeContent,
      lastUpdated: new Date()
    });
    console.log('✅ Successfully uploaded initial README to Firestore.');

  } catch (error) {
    console.error('Failed to initialize project:', error);
  }
  
  console.log('\n--- Initialization Complete! ---');
}

// Run the main function
initializeProjectReadme();