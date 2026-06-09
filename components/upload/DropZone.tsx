'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  label: string
  accept?: Record<string, string[]>
  onFileAccepted: (file: File) => void
  isLoading?: boolean
  currentFile?: File | null
  onRemove?: () => void
}

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

export function DropZone({ label, accept = DEFAULT_ACCEPT, onFileAccepted, isLoading, currentFile, onRemove }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) onFileAccepted(files[0])
    setDragOver(false)
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
  })

  const fmtSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

  if (currentFile) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-md border" style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.25)' }}>
        <div className="w-8 h-8 rounded-md bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80] flex-shrink-0" />
            <p className="text-sm text-[var(--text)] truncate">{currentFile.name}</p>
          </div>
          <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
            {fmtSize(currentFile.size)}
            {isLoading && <span className="ml-2 text-[var(--accent)]">Parsing…</span>}
          </p>
        </div>
        {onRemove && !isLoading && (
          <button onClick={onRemove} className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-overlay)] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'rounded-md border-2 border-dashed p-6 cursor-pointer transition-colors text-center',
        isDragActive || dragOver
          ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
          : 'border-[var(--border)] hover:border-[var(--border-md)] hover:bg-[var(--bg-overlay)]'
      )}
    >
      <input {...getInputProps()} />
      <motion.div animate={{ y: isDragActive ? -4 : 0 }} transition={{ type: 'spring', stiffness: 400 }}>
        <Upload className={cn('w-5 h-5 mx-auto mb-2', isDragActive ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]')} />
      </motion.div>
      <p className="text-sm text-[var(--text-muted)] mb-1">
        {isDragActive ? 'Drop it here' : label}
      </p>
      <p className="text-[11px] text-[var(--text-faint)]">
        PDF · DOCX · TXT · PNG · JPG
      </p>
    </div>
  )
}
