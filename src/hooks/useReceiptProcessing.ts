import { useState, useCallback } from 'react'
import { useMutation } from 'react-query'
import { processReceiptFromFile } from '../services/receiptProcessor'
import { isGoogleVisionConfigured } from '../services/googleVisionService'
import { ReceiptProcessingStatus } from '../types/receipt'
import toast from 'react-hot-toast'

export function useReceiptProcessing() {
  const [status, setStatus] = useState<ReceiptProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  })

  const uploadAndProcess = useMutation(
    async (file: File) => {
      // For now, skip storage upload and process directly from file
      setStatus({
        status: 'processing',
        progress: 30,
        message: 'Processing receipt...',
      })

      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX

      setStatus({
        status: 'processing',
        progress: 80,
        message: 'Analyzing products...',
      })

      const processingResult = await processReceiptFromFile(file)

      setStatus({
        status: 'completed',
        progress: 100,
        message: `Found ${processingResult.products.length} products!`,
        result: processingResult,
      })

      return {
        ...processingResult,
        receiptUrl: null, // No upload for now
        receiptPath: null,
      }
    },
    {
      onSuccess: (result) => {
        toast.success(`Successfully processed receipt! Found ${result.products.length} products.`)
      },
      onError: (error: Error) => {
        setStatus({
          status: 'error',
          progress: 0,
          message: error.message,
        })
        toast.error(`Processing failed: ${error.message}`)
      },
    }
  )

  const processClientSide = useMutation(
    async (file: File) => {
      isGoogleVisionConfigured()
      
      setStatus({
        status: 'processing',
        progress: 30,
        message: 'Processing receipt...',
      })

      const result = await processReceiptFromFile(file)

      setStatus({
        status: 'completed',
        progress: 100,
        message: `Found ${result.products.length} products!`,
        result,
      })

      return result
    },
    {
      onSuccess: (result) => {
        toast.success(`Successfully processed receipt! Found ${result.products.length} products.`)
      },
      onError: (error: Error) => {
        setStatus({
          status: 'error',
          progress: 0,
          message: error.message,
        })
        toast.error(`Processing failed: ${error.message}`)
      },
    }
  )

  const reset = useCallback(() => {
    setStatus({
      status: 'idle',
      progress: 0,
      message: '',
    })
  }, [])

  const isGoogleVisionEnabled = isGoogleVisionConfigured()

  return {
    status,
    uploadAndProcess: uploadAndProcess.mutateAsync,
    processClientSide: processClientSide.mutateAsync,
    isLoading: uploadAndProcess.isLoading || processClientSide.isLoading,
    isGoogleVisionEnabled,
    reset,
  }
} 