"""Template parser for extracting Jinja2 variables from docx templates.

Uses docxtpl's built-in get_undeclared_template_variables() method which properly
handles the "XML Split Tag" issue where Word inserts invisible XML formatting
inside Jinja2 tags, breaking regex-based extraction.
"""

import re
import zipfile
from docxtpl import DocxTemplate
from jinja2.exceptions import TemplateSyntaxError


def _extract_text_from_xml(xml_content: str) -> str:
    """Extract all text content from Word XML."""
    # Extract text from <w:t> tags
    texts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml_content)
    return ' '.join(texts)


def _extract_variables_from_text(text: str) -> set:
    """Extract variables from text using regex."""
    variables = set()

    # Match {{ variable }} or {{ variable.property }}
    var_pattern = r'\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s*\}\}'
    for match in re.finditer(var_pattern, text):
        var_name = match.group(1)
        root_var = var_name.split('.')[0]
        variables.add(root_var)

    # Match for loop collections
    for_pattern = r'\{%[-ptr]*\s*for\s+\w+\s+in\s+(\w+)\s*[-ptr]*%\}'
    for match in re.finditer(for_pattern, text):
        variables.add(match.group(1))

    return variables


def _detect_single_brace_fields(text: str) -> set:
    """Detect {field_name} style placeholders (not Jinja2 or sections).

    Matches single-brace placeholders like {name}, {email}, etc.
    but NOT Jinja2 syntax like {{ name }} or {% for %},
    and NOT section tags like {#section} or {/section}.
    """
    # Match {word} but NOT {{ or {% (Jinja2) or {# or {/ (sections)
    pattern = r'(?<!\{)\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})'
    fields = set(re.findall(pattern, text))
    # Filter out section-related patterns (those starting with # or /)
    return fields


def _detect_sections(text: str) -> dict:
    """Detect {#section}...{/section} patterns and classify them.

    Returns dict with:
    - 'conditionals': list of section names that have no nested fields (boolean)
    - 'loops': dict mapping section names to their nested field names (lists)
    """
    conditionals = []
    loops = {}

    # Match {#name}...{/name} sections (non-greedy, handles multiline)
    pattern = r'\{#(\w+)\}(.*?)\{/\1\}'
    for match in re.finditer(pattern, text, re.DOTALL):
        section_name = match.group(1)
        section_content = match.group(2)

        # Find nested {field} patterns inside section
        nested_fields = _detect_single_brace_fields(section_content)

        if nested_fields:
            # Has nested fields = list/loop section
            loops[section_name] = sorted(nested_fields)
        else:
            # No nested fields = conditional section
            conditionals.append(section_name)

    return {
        'conditionals': sorted(conditionals),
        'loops': loops
    }


def parse_docx_template(file_path: str) -> dict:
    """Parse a docx template and extract all Jinja2 variables.

    Uses docxtpl's built-in variable extraction which handles:
    - XML split tags (Word formatting inserted inside Jinja2 tags)
    - All Jinja2 syntax (loops, conditionals, filters)
    - Headers, footers, and tables

    Falls back to regex-based extraction if docxtpl fails (e.g., due to
    custom tags like {%tr for table rows).

    Also supports single-brace syntax {field_name} as an alternative format.

    Returns a dict with:
    - fields: list of simple field names
    - loops: dict mapping loop names to their item fields
    - syntax: 'jinja2' or 'single_brace' indicating template format
    """
    tpl = DocxTemplate(file_path)

    # Read raw XML and patch it (fixes XML split tag issue)
    with zipfile.ZipFile(file_path, 'r') as z:
        xml_content = z.read('word/document.xml').decode('utf-8')
    patched_xml = tpl.patch_xml(xml_content)

    # Extract raw text from XML for pattern matching
    # (handles {%tr tags which get stripped by patch_xml)
    raw_text = _extract_text_from_xml(xml_content)

    # Try to get variables using docxtpl's built-in method
    try:
        all_variables = tpl.get_undeclared_template_variables()
    except TemplateSyntaxError:
        # Fallback to regex extraction if Jinja2 parsing fails
        # (e.g., due to custom tags like {%tr, {%tc, {%p)
        all_variables = _extract_variables_from_text(raw_text)

    # Find loops: {% for item in collection %} or {%p for item in collection %}
    # Also handles {%tr for table rows and {%tc for table columns
    # Use raw_text because patched_xml strips {%tr tags
    loop_pattern = r'\{%[-ptr]*\s*for\s+(\w+)\s+in\s+(\w+)\s*[-ptr]*%\}'
    loops = re.findall(loop_pattern, raw_text)

    # Extract item fields for each loop
    loop_fields = {}
    loop_collections = set()
    for item_var, collection in loops:
        # Find all {{ item.field }} patterns
        field_pattern = rf'\{{\{{\s*{item_var}\.(\w+)'
        fields = list(set(re.findall(field_pattern, raw_text)))
        if fields:
            loop_fields[collection] = sorted(fields)
            loop_collections.add(collection)

    # Simple fields = all variables - loop collections
    simple_fields = sorted(all_variables - loop_collections)

    # If no Jinja2 fields found, try single-brace syntax {field_name}
    if not simple_fields and not loop_fields:
        # Detect sections: {#section}...{/section}
        sections = _detect_sections(raw_text)

        # Detect simple fields (excluding those inside sections)
        all_single_brace = _detect_single_brace_fields(raw_text)

        # Get fields that are inside sections (to exclude from simple fields)
        section_fields = set()
        for fields_list in sections['loops'].values():
            section_fields.update(fields_list)

        # Simple fields = all fields - fields inside sections
        single_brace_fields = all_single_brace - section_fields

        if single_brace_fields or sections['loops'] or sections['conditionals']:
            return {
                'fields': sorted(single_brace_fields),
                'loops': sections['loops'],
                'conditionals': sections['conditionals'],
                'syntax': 'single_brace'
            }

    return {
        'fields': simple_fields,
        'loops': loop_fields,
        'conditionals': [],
        'syntax': 'jinja2'
    }
