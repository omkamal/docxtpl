import { useState, useCallback } from 'react';
import { DropZone } from './components/DropZone';
import { DynamicForm } from './components/DynamicForm';
import { uploadTemplate, generateDocument, getErrorMessage, type TemplateFields } from './api';
import './App.css';

function App() {
  const [templateFields, setTemplateFields] = useState<TemplateFields | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    console.log('Uploading file:', file.name);

    try {
      const fields = await uploadTemplate(file);
      console.log('Upload response:', fields);

      // Check if template has any extractable fields
      const hasConditionals = (fields.conditionals || []).length > 0;
      if (fields.fields.length === 0 && Object.keys(fields.loops).length === 0 && !hasConditionals) {
        let errorMsg = 'No template fields found. Ensure your template uses {{ field_name }} syntax (e.g., {{ name }}, {{ email }}).';

        // Add hints if non-Jinja2 patterns were detected
        if (fields.hints && fields.hints.length > 0) {
          errorMsg += '\n\nSuggestions:\n• ' + fields.hints.join('\n• ');
        }

        setError(errorMsg);
        setTemplateFields(null);
        return;
      }

      setTemplateFields(fields);
    } catch (err) {
      console.error('Upload error:', err);
      setError(getErrorMessage(err));
      setTemplateFields(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFormSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (!templateFields) return;

      setError(null);
      setIsGenerating(true);

      try {
        const blob = await generateDocument({
          template_id: templateFields.template_id,
          data,
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Generate error:', err);
        setError(getErrorMessage(err));
      } finally {
        setIsGenerating(false);
      }
    },
    [templateFields]
  );

  const handleReset = useCallback(() => {
    setTemplateFields(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header>
        <h1>DocxTpl Template Filler</h1>
        <p>Upload a Word template and fill in the fields</p>
      </header>

      <main>
        {error && (
          <div className="error" data-testid="error-message">
            {error}
          </div>
        )}

        {!templateFields ? (
          <DropZone onFileSelect={handleFileSelect} isLoading={isUploading} />
        ) : (
          <>
            <div className="template-info">
              <p>Template loaded successfully!</p>
              <button onClick={handleReset} className="reset-btn">
                Upload Different Template
              </button>
            </div>
            <DynamicForm
              templateFields={templateFields}
              onSubmit={handleFormSubmit}
              isGenerating={isGenerating}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
