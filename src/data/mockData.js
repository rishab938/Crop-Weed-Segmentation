// Mock data for the entire application
export const mockUser = {
  id: 'usr_01',
  name: 'Rishab Verma',
  email: 'rishab@cropweedai.com',
  role: 'Agronomist',
  avatar: null,
  initials: 'RV',
  plan: 'Pro',
};

export const mockProjects = [];

export const mockAnalysis = {
  ana_01: {
    id: 'ana_01',
    projectId: 'proj_01',
    projectName: 'Maize Block A — 2025 season',
    fieldName: 'North Field',
    date: '2025-03-12',
    imagesStitched: 6,
    weedCoverage: 18.4,
    cropCoverage: 81.6,
    weedDensity: 'Medium',
    weedDensityValue: 7.1,
    hotspots: 12,
    largestHotspot: 0.34,
    zones: [
      { id: 'Z1', coverage: 8 },
      { id: 'Z2', coverage: 14 },
      { id: 'Z3', coverage: 27.4 },
      { id: 'Z4', coverage: 11 },
      { id: 'Z5', coverage: 19 },
      { id: 'Z6', coverage: 22 },
    ],
    densityDistribution: [
      { label: 'Low', value: 24, color: '#84cc16' },
      { label: 'Medium', value: 41, color: '#84cc16' },
      { label: 'High', value: 35, color: '#ef4444' },
    ],
  },
};

export const mockPipelineStages = [
  { id: 1, name: 'Upload',        status: 'completed', time: '14:28' },
  { id: 2, name: 'Validation',    status: 'completed', time: '14:29' },
  { id: 3, name: 'Preprocessing', status: 'completed', time: '14:30' },
  { id: 4, name: 'Segmentation',  status: 'completed', time: '14:31' },
  { id: 5, name: 'Stitching',     status: 'completed', time: '14:32' },
  { id: 6, name: 'Field Map',     status: 'failed',    time: '14:34' },
  { id: 7, name: 'Analysis',      status: 'pending',   time: null },
  { id: 8, name: 'Treatment',     status: 'pending',   time: null },
  { id: 9, name: 'Report',        status: 'pending',   time: null },
];

export const mockPipelineLog = [
  { time: '14:32', level: 'info',    message: 'Stitching finished · 6 frames merged into one field image' },
  { time: '14:33', level: 'info',    message: 'Field map generation started' },
  { time: '14:33', level: 'warning', message: 'Warning · frame 4 overlap 32%, below the 40% threshold' },
  { time: '14:34', level: 'error',   message: 'Error · field map generation aborted, stage 7 not started' },
];

export const mockTreatment = {
  targetArea: 3.8,
  totalArea: 12.4,
  weedThreshold: '15% per zone',
  treatmentZones: 3,
  routeDistance: 1.24,
  estimatedCoverage: 92,
  waypoints: 6,
  pathPattern: 'Serpentine · 3 passes',
  estimatedTravel: '9 min at 8 km/h',
};

export const mockReports = [];

export const mockWeedTrend = [];

export const mockActivity = [];

export const mockDashboardStats = {
  totalProjects: 0,
  imagesAnalyzed: 0,
  fieldsProcessed: 0,
  avgWeedCoverage: 0,
};

export const mockNotifications = [];
