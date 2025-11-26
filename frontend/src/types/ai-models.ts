/**
 * AI Model Types - Type definitions for multi-model lab analysis
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  has_vision: boolean;
  status: 'available' | 'requires_api_key';
  recommended_for: string[];
  capabilities: string[];
}

export interface AvailableModelsResponse {
  models: AIModel[];
}

export interface ApiKeyStorageResponse {
  message: string;
  expires_in_seconds: number;
  keys_stored: number;
}
