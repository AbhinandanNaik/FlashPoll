# ⚡ FlashPoll - Instant Anonymous Voting

FlashPoll is a full-stack web application that allows users to create anonymous polls, share them via a unique link, and view voting results in real-time.

**Goal:** Built to demonstrate Full-Stack capabilities including RESTful API design, Relational Database modeling, and Server-Side Rendering.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://flashpoll-a.onrender.com)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20EJS%20%7C%20SQLite-blue)](https://nodejs.org)

**🔴 Try it here:** [https://flashpoll-a.onrender.com](https://flashpoll-a.onrender.com)

---

## 🛠️ Tech Stack
* **Backend:** Node.js, Express.js
* **Frontend:** EJS (Embedded JavaScript), CSS3
* **Database:** SQLite3 (Relational)
* **Utilities:** UUID (Unique ID generation)

## 🌟 Key Features
1.  **Create Polls:** Dynamic form handling to accept questions and variable options.
2.  **Unique URLs:** Every poll gets a UUID (e.g., `/poll/a1b2-c3d4`) for easy sharing.
3.  **Visual Results:** Percentage-based progress bars calculated server-side.
4.  **Data Integrity:** SQL Foreign Keys ensure votes are linked to the correct poll options.

## 🚀 How to Run Locally

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/flashpoll.git](https://github.com/your-username/flashpoll.git)
    cd flashpoll
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    node app.js
    ```

4.  **View the App**
    Open your browser and visit: `http://localhost:3000`

## 🗄️ Database Schema
The project uses **SQLite**. The database file `polls.db` is automatically created on the first run.

* **Table: Polls** (`id` [PK], `question`)
* **Table: Options** (`id` [PK], `poll_id` [FK], `text`, `votes`)

---
*Built by Abhinandan Naik*