"""Tests for template_parser module.

Tests the parse_docx_template function which uses docxtpl's built-in
get_undeclared_template_variables() method to properly handle XML split tags.
"""

import pytest
from app.template_parser import parse_docx_template


class TestParseDocxTemplate:
    """Tests for parse_docx_template function."""

    def test_simple_template(self, simple_template):
        """Test parsing a simple template."""
        result = parse_docx_template(simple_template)

        assert "fields" in result
        assert "loops" in result
        assert "name" in result["fields"]
        assert "email" in result["fields"]
        assert "company" in result["fields"]
        assert result["loops"] == {}

    def test_resume_template(self, resume_template):
        """Test parsing a resume template with loops."""
        result = parse_docx_template(resume_template)

        # Check simple fields
        assert "full_name" in result["fields"]
        assert "email" in result["fields"]
        assert "phone" in result["fields"]
        assert "location" in result["fields"]
        assert "summary" in result["fields"]
        assert "skills" in result["fields"]

        # Check loops
        assert "experience" in result["loops"]
        assert "education" in result["loops"]

        # Check loop fields
        exp_fields = result["loops"]["experience"]
        assert "title" in exp_fields
        assert "company" in exp_fields
        assert "description" in exp_fields

        edu_fields = result["loops"]["education"]
        assert "degree" in edu_fields
        assert "school" in edu_fields
        assert "year" in edu_fields

    def test_template_with_table(self, template_with_table):
        """Test parsing a template with table row loops."""
        result = parse_docx_template(template_with_table)

        assert "customer_name" in result["fields"]
        assert "items" in result["loops"]
        assert "name" in result["loops"]["items"]
        assert "quantity" in result["loops"]["items"]
        assert "price" in result["loops"]["items"]

    def test_fields_sorted(self, simple_template):
        """Test that fields are returned sorted."""
        result = parse_docx_template(simple_template)
        assert result["fields"] == sorted(result["fields"])

    def test_single_brace_template(self, single_brace_template):
        """Test parsing a template with {field} syntax."""
        result = parse_docx_template(single_brace_template)

        assert "fields" in result
        assert "syntax" in result
        assert result["syntax"] == "single_brace"
        assert "name" in result["fields"]
        assert "email" in result["fields"]
        assert "company" in result["fields"]
        assert result["loops"] == {}

    def test_jinja2_syntax_type(self, simple_template):
        """Test that Jinja2 templates return correct syntax type."""
        result = parse_docx_template(simple_template)
        assert result["syntax"] == "jinja2"

    def test_template_with_sections(self, template_with_sections):
        """Test parsing a template with conditional and list sections."""
        result = parse_docx_template(template_with_sections)

        # Check basic structure
        assert "fields" in result
        assert "loops" in result
        assert "conditionals" in result
        assert result["syntax"] == "single_brace"

        # Check simple fields (outside sections)
        assert "name" in result["fields"]
        assert "email" in result["fields"]

        # Check list section
        assert "products" in result["loops"]
        assert "product_name" in result["loops"]["products"]
        assert "price" in result["loops"]["products"]

        # Check conditional section
        assert "disclaimer" in result["conditionals"]

    def test_section_fields_not_in_simple_fields(self, template_with_sections):
        """Test that fields inside sections are not included in simple fields."""
        result = parse_docx_template(template_with_sections)

        # Fields inside list sections should NOT be in simple fields
        assert "product_name" not in result["fields"]
        assert "price" not in result["fields"]
