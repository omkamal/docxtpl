import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DropZone } from './DropZone'

describe('DropZone', () => {
  it('renders drop zone with instructions', () => {
    const onFileSelect = vi.fn()
    render(<DropZone onFileSelect={onFileSelect} isLoading={false} />)

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/browse files/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const onFileSelect = vi.fn()
    render(<DropZone onFileSelect={onFileSelect} isLoading={true} />)

    expect(screen.getByText(/processing template/i)).toBeInTheDocument()
    expect(screen.queryByText(/drag and drop/i)).not.toBeInTheDocument()
  })

  it('calls onFileSelect when file is selected via input', () => {
    const onFileSelect = vi.fn()
    render(<DropZone onFileSelect={onFileSelect} isLoading={false} />)

    const input = screen.getByTestId('file-input')
    const file = new File(['test content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    Object.defineProperty(input, 'files', {
      value: [file]
    })

    fireEvent.change(input)

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('handles drag over state', () => {
    const onFileSelect = vi.fn()
    render(<DropZone onFileSelect={onFileSelect} isLoading={false} />)

    const dropZone = screen.getByTestId('drop-zone')

    fireEvent.dragOver(dropZone)
    expect(dropZone).toHaveClass('dragging')

    fireEvent.dragLeave(dropZone)
    expect(dropZone).not.toHaveClass('dragging')
  })

  it('handles file drop with valid docx file', () => {
    const onFileSelect = vi.fn()
    render(<DropZone onFileSelect={onFileSelect} isLoading={false} />)

    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['test content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    const dataTransfer = {
      files: [file]
    }

    fireEvent.drop(dropZone, { dataTransfer })

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('rejects non-docx files with alert', () => {
    const onFileSelect = vi.fn()
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<DropZone onFileSelect={onFileSelect} isLoading={false} />)

    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    const dataTransfer = {
      files: [file]
    }

    fireEvent.drop(dropZone, { dataTransfer })

    expect(onFileSelect).not.toHaveBeenCalled()
    expect(alertMock).toHaveBeenCalledWith('Please drop a .docx file')

    alertMock.mockRestore()
  })
})
