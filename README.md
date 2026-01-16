# DocxTpl Template Filler

A web application for filling Word document templates with dynamic data. Supports both Jinja2 and simple single-brace placeholder syntax.

## Features

- **Drag & Drop Upload** - Upload .docx templates easily
- **Auto-Detection** - Automatically extracts fields, conditionals, and lists from templates
- **Dynamic Forms** - Generates input forms based on template structure
- **Multiple Syntax Support**:
  - Jinja2: `{{ field }}`, `{% for item in items %}`
  - Single-brace: `{field}`, `{#section}...{/section}`
- **Conditional Sections** - Toggle optional content with checkboxes
- **Repeatable Sections** - Add/remove items for list content
- **Instant Generation** - Download filled documents immediately

## Template Syntax

### Jinja2 Syntax (Default)
```
Name: {{ name }}
Email: {{ email }}

{% for item in items %}
- {{ item.name }}: {{ item.price }}
{% endfor %}
```

### Single-Brace Syntax (Alternative)
```
Name: {name}
Email: {email}

{#disclaimer}
This is optional legal text.
{/disclaimer}

{#products}
Product: {product_name} - Price: {price}
{/products}
```

| Syntax | Purpose | Example |
|--------|---------|---------|
| `{field}` | Simple text placeholder | `{name}`, `{email}` |
| `{#section}...{/section}` | Conditional (no nested fields) | `{#disclaimer}Text{/disclaimer}` |
| `{#list}...{/list}` | Repeatable (with nested fields) | `{#products}{name}{/products}` |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- uv (Python package manager)

### Backend Setup

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Open the app** at `http://localhost:5173`
2. **Upload a template** - Drag & drop or click to select a .docx file
3. **Fill the form** - Enter values for detected fields
4. **Toggle sections** - Check/uncheck optional sections
5. **Add list items** - Click "Add" for repeatable sections
6. **Generate** - Click "Generate Document" to download

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload template, returns extracted fields |
| `/api/generate` | POST | Generate filled document |
| `/api/health` | GET | Health check |

### Upload Response Example

```json
{
  "template_id": "uuid",
  "fields": ["name", "email"],
  "loops": {
    "products": ["product_name", "price"]
  },
  "conditionals": ["disclaimer"],
  "syntax": "single_brace"
}
```

## Development

### Run Backend Tests

```bash
cd backend
uv run pytest -v
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Project Structure

```
docxtpl/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI endpoints
│   │   ├── template_parser.py   # Template field extraction
│   │   └── document_generator.py # Document generation
│   └── tests/                   # Backend tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main app
│   │   ├── api.ts               # API client
│   │   └── components/
│   │       ├── DropZone.tsx     # File upload
│   │       └── DynamicForm.tsx  # Dynamic form
│   └── tests/                   # Frontend tests
├── docs/                        # Documentation & proposals
└── resume_template.docx         # Sample template
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Python + FastAPI |
| Template Engine | python-docx-template (docxtpl) |
| Document Format | OOXML (.docx) |

## License

MIT
