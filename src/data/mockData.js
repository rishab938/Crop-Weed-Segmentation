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

export const mockProjects = [
  {
    id: 'proj_01',
    name: 'Maize Block A — 2025 season',
    fieldName: 'North Field · 12.4 ha',
    status: 'completed',
    date: '2025-03-12',
    images: 6,
    weedCoverage: 18.4,
    fieldSize: 12.4,
    analysisId: 'ana_01',
  },
  {
    id: 'proj_02',
    name: 'Wheat South — Spring Survey',
    fieldName: 'South Block · 8.7 ha',
    status: 'completed',
    date: '2025-02-28',
    images: 9,
    weedCoverage: 12.1,
    fieldSize: 8.7,
    analysisId: 'ana_02',
  },
  {
    id: 'proj_03',
    name: 'Soybean Patch B',
    fieldName: 'East Field · 5.2 ha',
    status: 'processing',
    date: '2025-03-20',
    images: 4,
    weedCoverage: null,
    fieldSize: 5.2,
    analysisId: 'ana_03',
  },
  {
    id: 'proj_04',
    name: 'Corn Zone 3 — Early Season',
    fieldName: 'West Corridor · 18.0 ha',
    status: 'draft',
    date: '2025-03-25',
    images: 0,
    weedCoverage: null,
    fieldSize: 18.0,
    analysisId: null,
  },
  {
    id: 'proj_05',
    name: 'Barley Survey — Field 7',
    fieldName: 'Field 7 · 6.8 ha',
    status: 'failed',
    date: '2025-03-18',
    images: 3,
    weedCoverage: null,
    fieldSize: 6.8,
    analysisId: null,
  },
  {
    id: 'proj_06',
    name: 'Rice Paddock — Season 1',
    fieldName: 'Paddock A · 4.1 ha',
    status: 'completed',
    date: '2025-01-15',
    images: 7,
    weedCoverage: 8.9,
    fieldSize: 4.1,
    analysisId: 'ana_04',
  },
];

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

export const mockReports = [
  {
    id: 'rep_01',
    projectName: 'Maize Block A — 2025 season',
    fieldName: 'North Field',
    date: '2025-03-12',
    weedCoverage: 18.4,
    status: 'ready',
    analysisId: 'ana_01',
  },
  {
    id: 'rep_02',
    projectName: 'Wheat South — Spring Survey',
    fieldName: 'South Block',
    date: '2025-02-28',
    weedCoverage: 12.1,
    status: 'ready',
    analysisId: 'ana_02',
  },
  {
    id: 'rep_03',
    projectName: 'Rice Paddock — Season 1',
    fieldName: 'Paddock A',
    date: '2025-01-15',
    weedCoverage: 8.9,
    status: 'ready',
    analysisId: 'ana_04',
  },
];

export const mockWeedTrend = [
  { month: 'Oct', coverage: 22 },
  { month: 'Nov', coverage: 19 },
  { month: 'Dec', coverage: 25 },
  { month: 'Jan', coverage: 16 },
  { month: 'Feb', coverage: 12 },
  { month: 'Mar', coverage: 18 },
];

export const mockActivity = [
  { id: 1, action: 'Analysis completed',    project: 'Maize Block A',     time: '2 hours ago', type: 'success' },
  { id: 2, action: 'Treatment map generated', project: 'Maize Block A',   time: '2 hours ago', type: 'success' },
  { id: 3, action: 'Processing started',    project: 'Soybean Patch B',   time: '3 hours ago', type: 'info' },
  { id: 4, action: 'Report downloaded',     project: 'Wheat South',       time: 'Yesterday',   type: 'info' },
  { id: 5, action: 'Pipeline failed',       project: 'Barley Survey',     time: '2 days ago',  type: 'error' },
];

export const mockDashboardStats = {
  totalProjects: 6,
  imagesAnalyzed: 142,
  fieldsProcessed: 4,
  avgWeedCoverage: 13.1,
};

export const mockNotifications = [
  { id: 1, text: 'Soybean Patch B analysis is 67% complete', time: '10 min ago', read: false },
  { id: 2, text: 'Maize Block A report is ready for download', time: '2 hrs ago', read: false },
  { id: 3, text: 'Barley Survey pipeline failed at Field Map stage', time: 'Yesterday', read: true },
];
