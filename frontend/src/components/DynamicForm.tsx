import React, { useState, useCallback } from 'react';
import type { TemplateFields } from '../api';

interface DynamicFormProps {
  templateFields: TemplateFields;
  onSubmit: (data: Record<string, unknown>) => void;
  isGenerating: boolean;
}

interface LoopItem {
  [key: string]: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  templateFields,
  onSubmit,
  isGenerating,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [conditionalData, setConditionalData] = useState<Record<string, boolean>>(() => {
    // Initialize all conditionals as false (unchecked)
    const initial: Record<string, boolean> = {};
    for (const conditional of templateFields.conditionals || []) {
      initial[conditional] = false;
    }
    return initial;
  });
  const [loopData, setLoopData] = useState<Record<string, LoopItem[]>>(() => {
    // Initialize each loop with one empty item
    const initial: Record<string, LoopItem[]> = {};
    for (const [loopName, fields] of Object.entries(templateFields.loops)) {
      const emptyItem: LoopItem = {};
      for (const field of fields) {
        emptyItem[field] = '';
      }
      initial[loopName] = [emptyItem];
    }
    return initial;
  });

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleConditionalChange = useCallback((field: string, checked: boolean) => {
    setConditionalData((prev) => ({ ...prev, [field]: checked }));
  }, []);

  const handleLoopFieldChange = useCallback(
    (loopName: string, index: number, field: string, value: string) => {
      setLoopData((prev) => {
        const items = [...(prev[loopName] || [])];
        items[index] = { ...items[index], [field]: value };
        return { ...prev, [loopName]: items };
      });
    },
    []
  );

  const addLoopItem = useCallback((loopName: string, fields: string[]) => {
    setLoopData((prev) => {
      const emptyItem: LoopItem = {};
      for (const field of fields) {
        emptyItem[field] = '';
      }
      return {
        ...prev,
        [loopName]: [...(prev[loopName] || []), emptyItem],
      };
    });
  }, []);

  const removeLoopItem = useCallback((loopName: string, index: number) => {
    setLoopData((prev) => {
      const items = [...(prev[loopName] || [])];
      items.splice(index, 1);
      return { ...prev, [loopName]: items };
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data: Record<string, unknown> = { ...formData, ...conditionalData, ...loopData };
      onSubmit(data);
    },
    [formData, conditionalData, loopData, onSubmit]
  );

  const formatFieldName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const hasFields = templateFields.fields.length > 0;
  const hasLoops = Object.keys(templateFields.loops).length > 0;
  const hasConditionals = (templateFields.conditionals || []).length > 0;

  // Defensive check - should not happen with App.tsx validation
  if (!hasFields && !hasLoops && !hasConditionals) {
    return (
      <div className="empty-form" data-testid="empty-form">
        <h2>No Fields Found</h2>
        <p>This template doesn't contain any fillable fields.</p>
        <p>Make sure your template uses Jinja2 syntax:</p>
        <ul>
          <li><code>{'{{ field_name }}'}</code> for simple fields</li>
          <li><code>{'{% for item in items %}'}</code> for loops</li>
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="dynamic-form" data-testid="dynamic-form">
      <h2>Fill in Template Fields</h2>

      {/* Simple fields */}
      {templateFields.fields.length > 0 && (
        <section className="form-section">
          <h3>Fields</h3>
          {templateFields.fields.map((field) => (
            <div key={field} className="form-field">
              <label htmlFor={field}>{formatFieldName(field)}</label>
              <input
                type="text"
                id={field}
                name={field}
                value={formData[field] || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                data-testid={`field-${field}`}
              />
            </div>
          ))}
        </section>
      )}

      {/* Conditional sections (checkboxes) */}
      {hasConditionals && (
        <section className="form-section">
          <h3>Optional Sections</h3>
          {templateFields.conditionals.map((conditional) => (
            <div key={conditional} className="form-field checkbox-field">
              <label htmlFor={conditional} className="checkbox-label">
                <input
                  type="checkbox"
                  id={conditional}
                  name={conditional}
                  checked={conditionalData[conditional] || false}
                  onChange={(e) => handleConditionalChange(conditional, e.target.checked)}
                  data-testid={`conditional-${conditional}`}
                />
                <span>{formatFieldName(conditional)}</span>
              </label>
            </div>
          ))}
        </section>
      )}

      {/* Loop fields */}
      {Object.entries(templateFields.loops).map(([loopName, fields]) => (
        <section key={loopName} className="form-section loop-section">
          <h3>{formatFieldName(loopName)}</h3>
          {(loopData[loopName] || []).map((item, index) => (
            <div key={index} className="loop-item" data-testid={`loop-${loopName}-${index}`}>
              <div className="loop-item-header">
                <span>Item {index + 1}</span>
                {loopData[loopName].length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLoopItem(loopName, index)}
                    className="remove-btn"
                    data-testid={`remove-${loopName}-${index}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              {fields.map((field) => (
                <div key={field} className="form-field">
                  <label htmlFor={`${loopName}-${index}-${field}`}>
                    {formatFieldName(field)}
                  </label>
                  <input
                    type="text"
                    id={`${loopName}-${index}-${field}`}
                    value={item[field] || ''}
                    onChange={(e) =>
                      handleLoopFieldChange(loopName, index, field, e.target.value)
                    }
                    data-testid={`field-${loopName}-${index}-${field}`}
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addLoopItem(loopName, fields)}
            className="add-btn"
            data-testid={`add-${loopName}`}
          >
            + Add {formatFieldName(loopName).replace(/s$/, '')}
          </button>
        </section>
      ))}

      <button
        type="submit"
        className="submit-btn"
        disabled={isGenerating}
        data-testid="generate-btn"
      >
        {isGenerating ? 'Generating...' : 'Generate Document'}
      </button>
    </form>
  );
};
