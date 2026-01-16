import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DynamicForm } from './DynamicForm'
import type { TemplateFields } from '../api'

describe('DynamicForm', () => {
  const simpleFields: TemplateFields = {
    template_id: 'test-123',
    fields: ['name', 'email', 'company'],
    loops: {}
  }

  const fieldsWithLoops: TemplateFields = {
    template_id: 'test-456',
    fields: ['full_name', 'summary'],
    loops: {
      experience: ['title', 'company', 'description'],
      education: ['degree', 'school']
    }
  }

  it('renders simple fields', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={simpleFields} onSubmit={onSubmit} isGenerating={false} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
  })

  it('renders loop sections', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={fieldsWithLoops} onSubmit={onSubmit} isGenerating={false} />)

    // Use role to find the heading specifically
    expect(screen.getByRole('heading', { name: /experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /education/i })).toBeInTheDocument()
  })

  it('allows adding loop items', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={fieldsWithLoops} onSubmit={onSubmit} isGenerating={false} />)

    // Initially one experience item
    expect(screen.getByTestId('loop-experience-0')).toBeInTheDocument()

    // Click add button
    fireEvent.click(screen.getByTestId('add-experience'))

    // Now should have two items
    expect(screen.getByTestId('loop-experience-0')).toBeInTheDocument()
    expect(screen.getByTestId('loop-experience-1')).toBeInTheDocument()
  })

  it('allows removing loop items', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={fieldsWithLoops} onSubmit={onSubmit} isGenerating={false} />)

    // Add a second item
    fireEvent.click(screen.getByTestId('add-experience'))
    expect(screen.getByTestId('loop-experience-1')).toBeInTheDocument()

    // Remove the first item
    fireEvent.click(screen.getByTestId('remove-experience-0'))

    // Should only have one item now
    expect(screen.queryByTestId('loop-experience-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('loop-experience-0')).toBeInTheDocument()
  })

  it('handles field input changes', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={simpleFields} onSubmit={onSubmit} isGenerating={false} />)

    const nameInput = screen.getByTestId('field-name')
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })

    expect(nameInput).toHaveValue('John Doe')
  })

  it('handles loop field input changes', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={fieldsWithLoops} onSubmit={onSubmit} isGenerating={false} />)

    const titleInput = screen.getByTestId('field-experience-0-title')
    fireEvent.change(titleInput, { target: { value: 'Software Engineer' } })

    expect(titleInput).toHaveValue('Software Engineer')
  })

  it('submits form with data', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={simpleFields} onSubmit={onSubmit} isGenerating={false} />)

    // Fill in fields
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('field-email'), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByTestId('field-company'), { target: { value: 'Acme' } })

    // Submit form
    fireEvent.click(screen.getByTestId('generate-btn'))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'John',
      email: 'john@test.com',
      company: 'Acme'
    }))
  })

  it('disables submit button when generating', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={simpleFields} onSubmit={onSubmit} isGenerating={true} />)

    const submitButton = screen.getByTestId('generate-btn')
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/generating/i)
  })

  it('formats field names correctly', () => {
    const onSubmit = vi.fn()
    const fields: TemplateFields = {
      template_id: 'test',
      fields: ['full_name', 'phoneNumber', 'home_address'],
      loops: {}
    }

    render(<DynamicForm templateFields={fields} onSubmit={onSubmit} isGenerating={false} />)

    // Should format snake_case and camelCase to readable labels
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/home address/i)).toBeInTheDocument()
  })

  it('submits loop data correctly', () => {
    const onSubmit = vi.fn()
    render(<DynamicForm templateFields={fieldsWithLoops} onSubmit={onSubmit} isGenerating={false} />)

    // Fill in experience fields
    fireEvent.change(screen.getByTestId('field-experience-0-title'), { target: { value: 'Developer' } })
    fireEvent.change(screen.getByTestId('field-experience-0-company'), { target: { value: 'Tech Corp' } })

    // Submit
    fireEvent.click(screen.getByTestId('generate-btn'))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      experience: expect.arrayContaining([
        expect.objectContaining({
          title: 'Developer',
          company: 'Tech Corp'
        })
      ])
    }))
  })
})
