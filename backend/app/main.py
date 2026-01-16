"""FastAPI application for docxtpl template processing."""

import os
import tempfile
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .template_parser import parse_docx_template
from .document_generator import generate_document

app = FastAPI(
    title="DocxTpl API",
    description="API for processing Word document templates with Jinja2 syntax",
    version="0.1.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for uploaded templates (in production, use proper storage)
# Stores {template_id: {'path': str, 'syntax': str}}
templates: dict[str, dict[str, str]] = {}


class TemplateFields(BaseModel):
    """Response model for template field extraction."""
    template_id: str
    fields: list[str]
    loops: dict[str, list[str]]
    conditionals: list[str] = []  # Boolean conditional sections
    syntax: str = 'jinja2'  # Template syntax type: 'jinja2' or 'single_brace'
    hints: list[str] | None = None  # Suggestions if non-Jinja2 patterns detected


class GenerateRequest(BaseModel):
    """Request model for document generation."""
    template_id: str
    data: dict


@app.post("/api/upload", response_model=TemplateFields)
async def upload_template(file: UploadFile = File(...)):
    """Upload a docx template and extract its fields.

    Returns the template ID and extracted fields/loops.
    """
    if not file.filename or not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="File must be a .docx file")

    # Generate unique ID for this template
    template_id = str(uuid.uuid4())

    # Save to temp file
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"{template_id}.docx")

    try:
        content = await file.read()
        with open(temp_path, 'wb') as f:
            f.write(content)

        # Parse the template
        result = parse_docx_template(temp_path)

        # Store the template path and syntax
        syntax = result.get('syntax', 'jinja2')
        templates[template_id] = {'path': temp_path, 'syntax': syntax}

        return TemplateFields(
            template_id=template_id,
            fields=result['fields'],
            loops=result['loops'],
            conditionals=result.get('conditionals', []),
            syntax=syntax,
            hints=result.get('hints')
        )

    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Error processing template: {str(e)}")


@app.post("/api/generate")
async def generate(request: GenerateRequest):
    """Generate a filled document from a template.

    Returns the generated docx file.
    """
    template_id = request.template_id
    data = request.data

    if template_id not in templates:
        raise HTTPException(status_code=404, detail="Template not found")

    template_info = templates[template_id]
    template_path = template_info['path']
    syntax = template_info.get('syntax', 'jinja2')

    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template file not found")

    try:
        output = generate_document(template_path, data, syntax)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=generated.docx"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
