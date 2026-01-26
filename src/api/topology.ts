
import { getAuthToken } from './getAuthToken';
import { API_BASE_URL } from '@/config/apiConfig';

// --- Common Types ---

// The payload is now a list of file paths (strings)
export interface FileListPayload {
  files: string[];
}

export type AnalysisType = 'incomer' | 'bus' | 'transformer' | 'cable' | 'coupling' | 'incomer_breaker';
export type FileTypeFilter = 'all' | 'si2s' | 'lf1s';

interface SavedFileDetail {
    source: string;
    result: string;
}

// --- API Function Responses ---

export interface SaveResponse {
  status: "success";
  files_saved: SavedFileDetail[];
}

export interface TopologyAnalysisResult {
    file: string;
    analysis: Record<string, any>;
}

export interface TopologyAnalysisResponse {
    status: "success";
    results: TopologyAnalysisResult[];
}

// --- API Functions ---

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        // No JSON body
    }
    const errorMessage = errorData?.detail || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return;
  }
  
  return response.json();
};

/**
 * Runs topology analysis on a list of files and saves the results next to the source files.
 */
export const runAndSaveTopology = async (
  projectId: string,
  files: string[],
  analysisTypes?: AnalysisType[]
): Promise<SaveResponse> => {
  const params = new URLSearchParams({ project_id: projectId });
  if (analysisTypes) {
    analysisTypes.forEach(type => params.append('analysis_types', type));
  }
  
  const payload: FileListPayload = { files };

  return fetchAPI(`/topology/run-and-save/bulk?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Generates and saves diagrams for a list of files.
 */
export const saveDiagrams = async (
  projectId: string,
  files: string[]
): Promise<SaveResponse> => {
  const params = new URLSearchParams({ project_id: projectId });
  const payload: FileListPayload = { files };

  return fetchAPI(`/topology/diagram/save?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Fetches and analyzes all relevant files in a project for their topology.
 */
export const analyzeTopology = async (
  projectId: string,
  fileType: FileTypeFilter = 'all',
  analysisTypes?: AnalysisType[]
): Promise<TopologyAnalysisResponse> => {
  const params = new URLSearchParams({ project_id: projectId, file_type: fileType });
  if (analysisTypes) {
    analysisTypes.forEach(type => params.append('analysis_types', type));
  }

  return fetchAPI(`/topology/analyze?${params.toString()}`, {
      method: 'POST' // Endpoint is POST even without a body
  });
};
