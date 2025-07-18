# AutoDocify: AI-Powered Documentation Generator

AutoDocify is a full-stack web application that automates the creation of software documentation. It features a Node.js backend that analyzes local project directories, reads key source code files for context, and uses the Google Gemini API to generate high-quality, context-aware documentation. The project is managed through a sleek, single-page web interface.

This tool is designed to save developers time and effort by eliminating the tedious task of writing boilerplate documentation, allowing them to focus on building great software.

## ✨ Key Features

* **Local Project Analysis:** Analyzes the file structure, dependencies, and source code of any local project folder.
* **AI-Powered Generation:** Leverages the Google Gemini API to generate multiple, in-depth documents (`README.md`, `SETUP.md`, `ARCHITECTURE.md`, etc.).
* **Context-Aware Content:** Reads the content of key files (`App.jsx`, `vite.config.js`, etc.) to provide the AI with deep context, resulting in highly specific and relevant documentation.
* **Web-Based UI:** A user-friendly, single-page frontend to input a project path and view/edit the generated documents.
* **Client-Server Architecture:** Built with a Node.js/Express.js backend server and a vanilla HTML/JS/Tailwind CSS frontend.
* **Resilient API Calls:** The backend includes an automatic retry mechanism with exponential backoff to handle temporary API overloads.

## 🛠️ Tech Stack

* **Backend:**
    * **Runtime:** Node.js
    * **Server:** Express.js
    * **AI:** Google Gemini API (`@google/generative-ai`)
    * **Utilities:** `cors`, `dotenv`, `chalk`, `ora`
* **Frontend:**
    * **Structure:** HTML5
    * **Styling:** Tailwind CSS
    * **Logic:** Vanilla JavaScript
    * **Markdown Parsing:** `marked.js`

## 📂 Project Structure

The project is organized into a simple monorepo structure with a clear separation between the frontend and backend.
autodoc-cli/
├── frontend/
│   └── index.html      # The single-page web application UI
├── node_modules/       # Server dependencies
├── .env                # Environment variables (for API key)
├── index.js            # The Node.js/Express backend server
└── package.json        # Project manifest and server dependencies
## 🚀 Getting Started

Follow these steps to set up and run the AutoDocify application on your local machine.

### Prerequisites

* **Node.js:** Version 18.x or higher.
* **npm:** Comes bundled with Node.js.
* **Google Gemini API Key:**
    1.  Go to [Google AI Studio](https://aistudio.google.com/).
    2.  Click "Get API key" and create a new API key.
    3.  Copy the key.

### Installation

1.  **Clone the Repository (or set up the folder):**
    Ensure all the project files (`index.js`, `package.json`, etc.) are in a single directory named `autodoc-cli`.

2.  **Create the `.env` file:**
    In the root of the `autodoc-cli` directory, create a file named `.env` and add your Gemini API key:
    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

3.  **Install Dependencies:**
    Open your terminal in the `autodoc-cli` directory and run the following command to install the backend dependencies:
    ```
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**
    From the `autodoc-cli` directory, run:
    ```
    node index.js
    ```
    You should see a confirmation message in your terminal that the server is running on `http://localhost:4000`.

2.  **Open the Frontend:**
    Open your web browser and navigate to:
    [http://localhost:4000](http://localhost:4000)

## 📋 How to Use

1.  Once the web interface is open, you will see an input field.
2.  Enter the **full, absolute path** to the project folder you want to document (e.g., `/Users/yourname/projects/my-react-app`).
3.  Click the **"Generate Documentation"** button.
4.  The application will send the path to the backend. The backend server (visible in your terminal) will show a progress spinner as it analyzes the files and communicates with the Gemini API.
5.  Once complete, the generated documents will appear in the side-by-side editor in your browser.
6.  You can click the tabs (`README.md`, `SETUP.md`, etc.) to view and edit each document. The right-hand pane shows a live preview of your edits.
