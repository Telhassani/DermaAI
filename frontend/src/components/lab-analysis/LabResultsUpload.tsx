'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { LabValue, LabResultUploadResponse } from '@/types/lab-analysis';

interface LabResultsUploadProps {
  patientId?: number;
  consultationId?: number;
  additionalNotes?: string;
  selectedModel?: string;
  userPrompt?: string;
  onSuccess: (result: LabResultUploadResponse) => void;
  onError: (error: string) => void;
}

export function LabResultsUpload({
  patientId,
  consultationId,
  additionalNotes,
  selectedModel,
  userPrompt,
  onSuccess,
  onError
}: LabResultsUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload PDF or image files (JPG, PNG)'
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File is too large. Maximum size is 10MB'
      };
    }

    return { valid: true };
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      console.log('File selected:', { name: file.name, size: file.size, type: file.type });
      const validation = validateFile(file);
      if (!validation.valid) {
        console.warn('File validation failed:', validation.error);
        onError(validation.error || 'Invalid file');
        return;
      }

      setUploadedFile(file);
      console.log('Starting upload for file:', file.name);
      await uploadFile(file);
    },
    [patientId, consultationId, additionalNotes, selectedModel, userPrompt, onError]
  );

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // Only append patient_id if it's provided
      if (patientId !== undefined) {
        formData.append('patient_id', patientId.toString());
      }

      if (consultationId) {
        formData.append('consultation_id', consultationId.toString());
      }

      if (additionalNotes) {
        formData.append('additional_notes', additionalNotes);
      }

      // Add model selection if provided
      if (selectedModel) {
        formData.append('selected_model', selectedModel);
      }

      // Add user prompt if provided
      if (userPrompt) {
        formData.append('user_prompt', userPrompt);
      }

      console.log('Uploading file with:', {
        patientId,
        consultationId,
        selectedModel,
        userPrompt: !!userPrompt,
        fileSize: file.size,
        fileName: file.name,
      });

      // Use API client which handles auth, token refresh, and error handling
      const response = await api.labResults.uploadAndAnalyze(formData);

      setUploadProgress(100);

      const result: LabResultUploadResponse = response.data;
      console.log('Upload successful:', { result });
      onSuccess(result);
      setUploadedFile(null);
    } catch (error: any) {
      let errorMessage = 'Failed to upload file';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Upload error:', {
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      onError(errorMessage);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) {
      return '📄';
    }
    return '🖼️';
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Drag and drop your lab result file here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Browse Files
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          disabled={isUploading}
        />
      </div>

      {/* File Info */}
      {uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{getFileIcon(uploadedFile.name)}</span>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          {isUploading && (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-xs text-gray-500">{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Supported Formats */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Supported formats:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>PDF documents (.pdf)</li>
          <li>Images (JPG, PNG)</li>
          <li>Maximum file size: 10MB</li>
        </ul>
      </div>
    </div>
  );
}
