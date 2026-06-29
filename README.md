# LocalSearch

A terminal-based local business directory application built with Node.js. Users can browse, search, create, and review local businesses — all from the command line.

### Future Business Leaders of America (FBLA)

![FBLA Logo](https://www-chs.stjohns.k12.fl.us/fbla/wp-content/uploads/sites/22/2025/08/FBLA_Logo_FullName_Horizontal_color-HiRes-scaled.jpg)

This software was presented at the Ohio FBLA 2026 and FBLA National Leadership conferences. Please refer to the following information in light of project details:

**Sources & Libraries**

Can be located in `./libraries.txt`

Compiled with nodeJS

Hosting provided by [Render](https://render.com)

## Overview

LocalSearch has two main parts: a **backend REST API** built with Express, and a **terminal UI frontend** built with neo-blessed. Users log in or sign up, then browse and interact with business listings without ever leaving the terminal.

## Features

- User authentication with login and signup flows, including a two-step verification code system
- Browse and search local businesses by name, area code, or category
- Create new business listings
- Leave star ratings and comments on businesses
- Persistent data storage via `@willdevv12/simplestore`

## Project Structure

```
LocalSearch/
├── app/                    # Terminal UI (neo-blessed frontend)
│   ├── app.js              # Entry point for the UI
│   ├── api/                # API communication layer
│   │   ├── loginHandler.js
│   │   ├── requestAPI.js
│   │   ├── requestData.js
│   │   ├── search.js
│   │   └── comments.js
│   ├── screens/            # Full-screen views
│   │   ├── login.js
│   │   ├── homepage.js
│   │   ├── searchForm.js
│   │   └── results.js
│   └── modules/            # Reusable UI components
│       ├── loginForm.js
│       ├── searchResults.js
│       ├── descriptionBox.js
│       ├── comment.js
│       ├── addComment.js
│       ├── valPrompt.js
│       └── error.js
├── backend/                # Express REST API
│   ├── server.js           # Server entry point (port 3000)
│   └── api/
│       ├── user.js         # Auth routes (/user)
│       └── data.js         # Business & comment routes (/data)
├── data/                   # JSON data store
│   ├── userData.json       # User accounts
│   └── content.json        # Business listings
├── moderation/             # Admin/moderation CLI tools
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher

## Installation

```bash
git clone <repo-url>
npm install
```

## Running the App

Start the backend server:

```bash
npm test
# or
node ./backend/server.js
```

The server will start on **http://localhost:3000**.

To launch the terminal UI (in a separate terminal):

```bash
node ./app/app.js
```

## API Reference

### User Routes (`/user`)

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | `/user/login`         | Login with username and password     |
| GET    | `/user/login/verify/:id` | Mark a login verification code as verified |
| POST   | `/user/login/verify`  | Exchange a verified code for a UUID session |
| POST   | `/user/signup`        | Register a new user                  |
| GET    | `/user/signup/verify/:id` | Mark a signup verification code as verified |
| POST   | `/user/signup/verify` | Complete signup and receive a UUID   |

### Data Routes (`/data`)

| Method | Endpoint                | Description                            |
|--------|-------------------------|----------------------------------------|
| POST   | `/data`                 | Retrieve all businesses (auth required) |
| POST   | `/data/business/new`    | Create a new business listing          |
| POST   | `/data/business/delete` | Delete a business you own `(deprecated)`  |
| POST   | `/data/comment`         | Post a comment and rating on a business |

All data routes require a valid `auth` UUID in the request body.

## Authentication Flow

LocalSearch uses a two-step verification system. On login or signup, a 6-digit code is returned. This code must be verified (simulating an out-of-band check), after which a UUID session token is issued and used for all subsequent requests.

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Backend REST API framework |
| `neo-blessed` | Terminal UI rendering |
| `@willdevv12/simplestore` | Simple JSON-based persistent storage |

## License

See `LICENSE` for details.
