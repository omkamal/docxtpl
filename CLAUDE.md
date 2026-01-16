# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DocxTpl Template Filler - A web application for filling Word document templates with a React frontend and Python/FastAPI backend using the docxtpl library.

## Development Commands

### Backend (Python/FastAPI)
```bash
cd backend
uv sync --dev                           # Install dependencies
uv run uvicorn app.main:app --reload   # Start dev server on :8000
uv run pytest tests/ -v                 # Run tests (40 tests)
```

### Frontend (React/TypeScript/Vite)
```bash
cd frontend
npm install                             # Install dependencies
npm run dev                             # Start dev server on :5173
npm test                                # Run tests (16 tests)
npm run build                           # Build for production
```

### Run All Tests
```bash
# From project root
.venv/bin/pytest backend/tests/ -v     # Backend: 40 tests
cd frontend && npm test                 # Frontend: 16 tests
```

## Architecture

```
docxtpl/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, endpoints
│   │   ├── template_parser.py   # Jinja2 variable extraction from docx
│   │   └── document_generator.py # Document generation with docxtpl
│   └── tests/                   # pytest tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main app component
│   │   ├── api.ts               # API client
│   │   └── components/
│   │       ├── DropZone.tsx     # Drag-and-drop file upload
│   │       └── DynamicForm.tsx  # Dynamic form from template fields
│   └── vitest.config.ts         # Test configuration
└── resume_template.docx         # Sample resume template
```

## API Endpoints

- `POST /api/upload` - Upload docx template, returns extracted fields/loops
- `POST /api/generate` - Generate filled document from template + data
- `GET /api/health` - Health check

## Key Features

- **Template Parsing**: Extracts Jinja2 variables (`{{ field }}`) and loops (`{% for item in items %}`) from docx files
- **Dynamic Forms**: Auto-generates forms based on extracted template fields
- **Loop Support**: Handles repeating sections (experience, education, etc.)
- **Placeholder Cleanup**: Removes unfilled placeholders from generated documents
