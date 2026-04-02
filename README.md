# 🎨 Flowify — Premium Flowchart Beautifier Service

Flowify is a web service that transforms raw flowchart inputs into beautifully styled, professional-grade SVG diagrams. Users provide their flowchart data — either as **Mermaid.js syntax** or as **sequential text steps** — and Flowify renders them with premium visual themes.

> **MVP Status:** Currently supports Mermaid code and text input. AI-powered image/PDF/Word parsing via Google Gemini is planned for a future release.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Mermaid.js Rendering** | Accepts standard Mermaid flowchart syntax and renders it into high-quality SVG |
| **Sequential Text Parsing** | Converts numbered/bulleted step lists into flowchart diagrams automatically |
| **7 Premium Themes** | Ocean, Sunset, Forest, Midnight, Corporate, Pastel, Monochrome |
| **JWT Authentication** | Secure user registration and login with bcrypt-hashed passwords |
| **Flowchart History** | Save, browse, search, update, and delete your past flowcharts |
| **Multi-Format Export** | Download as SVG, PNG (1×–4× scale), or PDF |
| **Pagination & Search** | Browse history with paginated results and title-based search |
| **REST API** | Clean, documented JSON API for all operations |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (v18+) |
| **Backend** | Express.js 5 |
| **Database** | SQLite 3 (via `sqlite3`) |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| **Rendering** | `@mermaid-js/mermaid-cli` (Puppeteer-based) |
| **Image Export** | `sharp` (PNG), Puppeteer (PDF) |
| **Frontend** | Vite + Vanilla JS |
| **Future AI** | Google Gemini Vision API (stub ready) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/fahroediin/flowify.git
cd flowify

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your own JWT_SECRET
```

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
PORT=3000
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
DB_PATH=./data/flowify.db

# Future AI integration
GEMINI_API_KEY=
```

### Running

```bash
# Start backend server only
npm run start

# Start backend with auto-reload (development)
npm run dev:server

# Start frontend dev server (Vite)
npm run dev:client

# Start both backend + frontend concurrently
npm run dev
```

| URL | Description |
|---|---|
| `http://localhost:3000` | Backend API |
| `http://localhost:5173` | Frontend UI (Vite dev server, proxies `/api` to backend) |

---

## 📁 Project Structure

```
flowify/
├── server/
│   ├── index.js                    # Express entry point
│   ├── config/
│   │   └── database.js             # SQLite init & schema creation
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── errorHandler.js         # Global error handler
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/*
│   │   ├── flowchartRoutes.js      # /api/flowcharts/*
│   │   └── themeRoutes.js          # /api/themes
│   ├── controllers/
│   │   ├── authController.js       # Auth request handlers
│   │   └── flowchartController.js  # Flowchart request handlers
│   └── services/
│       ├── authService.js          # User registration, login, JWT
│       ├── dbService.js            # Promisified SQLite helpers
│       ├── parserService.js        # Text → Mermaid converter
│       ├── renderService.js        # Mermaid → SVG renderer
│       ├── themeService.js         # Theme definitions & variables
│       └── exportService.js        # SVG → PNG / PDF exporter
├── src/                            # Frontend (Vite)
│   ├── index.html
│   ├── main.js                     # Client-side router & toast system
│   ├── styles/
│   │   └── main.css                # Dark theme UI styles
│   ├── pages/
│   │   ├── auth.js                 # Login / Register page
│   │   └── editor.js               # Main editor with live preview
│   └── utils/
│       ├── api.js                  # Fetch wrapper with JWT
│       └── auth.js                 # Token management
├── data/                           # SQLite database (auto-created)
├── uploads/                        # Temporary render files (auto-cleaned)
├── .env / .env.example
├── vite.config.js
└── package.json
```

---

## 🗄 Database Schema

### `users`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK) | Auto-increment |
| `name` | TEXT | User's display name |
| `email` | TEXT (UNIQUE) | Login email |
| `password` | TEXT | bcrypt-hashed password |
| `created_at` | DATETIME | Account creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### `flowcharts`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK) | Auto-increment |
| `user_id` | INTEGER (FK → users) | Owner |
| `title` | TEXT | Flowchart title (default: "Untitled Flowchart") |
| `input_type` | TEXT | `"mermaid"` or `"text"` |
| `input_content` | TEXT | Raw user input |
| `mermaid_code` | TEXT | Parsed Mermaid syntax |
| `theme` | TEXT | Theme ID (default: `"ocean"`) |
| `svg_output` | TEXT | Rendered SVG string |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

---

## 📡 API Documentation

**Base URL:** `http://localhost:3000/api`

All responses follow this format:

```json
{
    "success": true,
    "message": "...",
    "data": { ... }
}
```

**Authentication:** Protected endpoints require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### Health Check

#### `GET /api/health`

Check if the API server is running.

**Response `200`:**
```json
{ "success": true, "message": "Flowify API is running" }
```

---

### 🔓 Auth Endpoints

#### `POST /api/auth/register`

Register a new user account.

**Request Body:**
```json
{
    "name": "Fahrudin",
    "email": "fahrudin@example.com",
    "password": "securepassword123"
}
```

**Response `201`:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": { "id": 1, "name": "Fahrudin", "email": "fahrudin@example.com" },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Error `409`:** `{ "success": false, "message": "Email already registered" }`

---

#### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
    "email": "fahrudin@example.com",
    "password": "securepassword123"
}
```

**Response `200`:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": { "id": 1, "name": "Fahrudin", "email": "fahrudin@example.com" },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Error `401`:** `{ "success": false, "message": "Invalid email or password" }`

---

#### `GET /api/auth/me` 🔒

Get the currently authenticated user's profile.

**Response `200`:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Fahrudin",
        "email": "fahrudin@example.com",
        "created_at": "2026-04-02T14:30:00Z"
    }
}
```

---

### 📊 Flowchart Endpoints (All 🔒 Require JWT)

#### `POST /api/flowcharts/parse`

Parse input into Mermaid code without saving. Used for live preview.

**Request Body (Mermaid pass-through):**
```json
{
    "input_type": "mermaid",
    "content": "flowchart TD\n    A[Login] --> B[Dashboard]"
}
```

**Request Body (Text conversion):**
```json
{
    "input_type": "text",
    "content": "1. Login\n2. Validasi\n3. Dashboard"
}
```

**Response `200`:**
```json
{
    "success": true,
    "data": {
        "mermaid_code": "flowchart TD\n    Node1[\"Login\"]\n    Node2[\"Validasi\"]\n    Node3[\"Dashboard\"]\n    Node1 --> Node2\n    Node2 --> Node3\n",
        "is_valid": true
    }
}
```

**Error `400`:** `{ "success": false, "message": "Invalid input type" }`

---

#### `POST /api/flowcharts/render`

Render Mermaid code with a specific theme into SVG. Does **not** save to database.

**Request Body:**
```json
{
    "mermaid_code": "flowchart TD\n    A[Login] --> B[Dashboard]",
    "theme": "ocean"
}
```

**Response `200`:**
```json
{
    "success": true,
    "data": {
        "svg": "<svg xmlns='http://www.w3.org/2000/svg' ...>...</svg>",
        "theme": "ocean"
    }
}
```

---

#### `POST /api/flowcharts`

Save a flowchart to the user's history.

**Request Body:**
```json
{
    "title": "Login Flow",
    "input_type": "text",
    "input_content": "1. Login\n2. Dashboard",
    "mermaid_code": "flowchart TD\n    Node1[\"Login\"]\n    Node2[\"Dashboard\"]\n    Node1 --> Node2\n",
    "theme": "ocean",
    "svg_output": "<svg>...</svg>"
}
```

**Response `201`:**
```json
{
    "success": true,
    "message": "Flowchart saved",
    "data": {
        "id": 1,
        "user_id": 1,
        "title": "Login Flow",
        "input_type": "text",
        "input_content": "1. Login\n2. Dashboard",
        "mermaid_code": "...",
        "theme": "ocean",
        "svg_output": "<svg>...</svg>",
        "created_at": "2026-04-02T14:30:00",
        "updated_at": "2026-04-02T14:30:00"
    }
}
```

---

#### `GET /api/flowcharts`

List all flowcharts for the authenticated user. Supports pagination and search.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Items per page |
| `search` | string | — | Search by title (partial match) |

**Example:** `GET /api/flowcharts?page=1&limit=5&search=login`

**Response `200`:**
```json
{
    "success": true,
    "data": {
        "flowcharts": [
            {
                "id": 1,
                "title": "Login Flow",
                "input_type": "text",
                "theme": "ocean",
                "created_at": "2026-04-02T14:30:00",
                "updated_at": "2026-04-02T14:30:00"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 5,
            "total": 1,
            "total_pages": 1
        }
    }
}
```

---

#### `GET /api/flowcharts/:id`

Get a single flowchart with full details including SVG output.

**Response `200`:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "user_id": 1,
        "title": "Login Flow",
        "input_type": "text",
        "input_content": "1. Login\n2. Dashboard",
        "mermaid_code": "...",
        "theme": "ocean",
        "svg_output": "<svg>...</svg>",
        "created_at": "2026-04-02T14:30:00",
        "updated_at": "2026-04-02T14:30:00"
    }
}
```

**Error `404`:** `{ "success": false, "message": "Flowchart not found" }`

---

#### `PUT /api/flowcharts/:id`

Update an existing flowchart. Partial updates are supported — only send the fields you want to change.

**Request Body (all fields optional):**
```json
{
    "title": "Login Flow v2",
    "mermaid_code": "flowchart TD\n    A[Login] --> B[Dashboard] --> C[Profile]",
    "theme": "midnight",
    "svg_output": "<svg>...</svg>"
}
```

**Response `200`:**
```json
{
    "success": true,
    "message": "Flowchart updated",
    "data": { "id": 1, "title": "Login Flow v2", "theme": "midnight", "..." }
}
```

**Error `404`:** `{ "success": false, "message": "Flowchart not found" }`

---

#### `DELETE /api/flowcharts/:id`

Delete a flowchart from history.

**Response `200`:**
```json
{ "success": true, "message": "Flowchart deleted" }
```

**Error `404`:** `{ "success": false, "message": "Flowchart not found" }`

---

#### `POST /api/flowcharts/:id/export`

Export a saved flowchart to a downloadable file.

**Request Body:**
```json
{
    "format": "png",
    "scale": 2
}
```

| Field | Type | Values | Description |
|---|---|---|---|
| `format` | string | `"svg"`, `"png"`, `"pdf"` | Export format |
| `scale` | integer | `1`, `2`, `4` | Resolution multiplier (PNG only) |

**Response:** Binary file download with appropriate `Content-Type` and `Content-Disposition` headers.

| Format | Content-Type |
|---|---|
| `svg` | `image/svg+xml` |
| `png` | `image/png` |
| `pdf` | `application/pdf` |

---

### 🎨 Theme Endpoints

#### `GET /api/themes`

List all available visual themes. **No authentication required.**

**Response `200`:**
```json
{
    "success": true,
    "data": [
        { "id": "ocean",      "name": "Ocean",      "description": "Blue gradients, clean lines" },
        { "id": "sunset",     "name": "Sunset",     "description": "Warm oranges and purples" },
        { "id": "forest",     "name": "Forest",     "description": "Green tones, organic feel" },
        { "id": "midnight",   "name": "Midnight",   "description": "Dark mode, neon accents" },
        { "id": "corporate",  "name": "Corporate",  "description": "Professional, muted colors" },
        { "id": "pastel",     "name": "Pastel",     "description": "Soft, friendly colors" },
        { "id": "monochrome", "name": "Monochrome", "description": "Black & white, elegant" }
    ]
}
```

---

## 🔐 Authentication Flow

1. **Register** — `POST /api/auth/register` → receive JWT token
2. **Login** — `POST /api/auth/login` → receive JWT token
3. **Use token** — Include `Authorization: Bearer <token>` in all subsequent requests
4. **Token expiry** — Tokens expire after the duration set in `JWT_EXPIRES_IN` (default: 7 days)

---

## 🎨 Available Themes

| Theme | Node Color | Text Color | Border Color | Line Color |
|---|---|---|---|---|
| **Ocean** | `#bae6fd` | `#0369a1` | `#0284c7` | `#0ea5e9` |
| **Sunset** | `#fed7aa` | `#9a3412` | `#ea580c` | `#f97316` |
| **Forest** | `#bbf7d0` | `#166534` | `#15803d` | `#22c55e` |
| **Midnight** | `#312e81` | `#e0e7ff` | `#6366f1` | `#8b5cf6` |
| **Corporate** | `#e2e8f0` | `#0f172a` | `#475569` | `#334155` |
| **Pastel** | `#f1f5f9` | `#475569` | `#cbd5e1` | `#94a3b8` |
| **Monochrome** | `#ffffff` | `#000000` | `#000000` | `#000000` |

---

## 📝 Input Format Examples

### Mermaid Syntax (Direct)

```
flowchart TD
    A[Login Page] --> B{Valid Credentials?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Show Error]
    D --> A
    C --> E[Profile]
    C --> F[Settings]
```

### Sequential Text (Auto-Converted)

```
1. User opens the Login page
2. User fills in username and password
3. System validates credentials
4. Dashboard is displayed
5. User can access Profile or Settings
```

The text parser converts each line into a connected node in a top-down flowchart.

---

## 🗺 Roadmap

- [x] JWT authentication (register, login, profile)
- [x] Mermaid.js syntax rendering with theme support
- [x] Sequential text → Mermaid parser
- [x] 7 premium themes
- [x] Flowchart CRUD with history
- [x] Pagination and search
- [x] Export to SVG / PNG / PDF
- [ ] AI-powered image → flowchart (Google Gemini Vision)
- [ ] AI-powered PDF/Word → flowchart (Google Gemini)
- [ ] Branching text parser (indented sub-steps / decision nodes)
- [ ] Collaborative editing
- [ ] Custom theme builder

---

## 📄 License

ISC
