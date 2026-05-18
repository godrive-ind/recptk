import { create } from 'zustand';

// Simulating UUID generation since we don't have crypto.randomUUID everywhere
const generateId = () => Math.random().toString(36).substr(2, 9);

export interface MasterItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface PTK {
  id: string;
  no_ptk: string;
  posisi: string;
  jabatan: string;
  departemen: string;
  kontrak: string;
  alasan: string;
  pic: string;
  sdm_digantikan: string;
  nik_digantikan: string;
  tgl_keluar_mutasi: string;
  keterangan_alasan: string;
  recruiter: string;
  gaji_ditawarkan: string;
  tgl_ptk_masuk: string;
  tgl_acc_ptk: string;
  total_permintaan: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  ptk_id: string;
  nama_kandidat: string;
  no_wa_kandidat: string;
  melamar_melalui: string;
  tgl_join_tolak: string;
  proses_rekrutmen: string;
  tgl_psikotes: string;
  tgl_itw_hr: string;
  tgl_itw_user: string;
  hasil_rekrutmen: string;
  gaji_disepakati: string;
  created_at: string;
}

interface AppState {
  ptks: PTK[];
  candidates: Candidate[];
  departments: MasterItem[];
  recruiters: MasterItem[];
  pics: MasterItem[];
  reasons: MasterItem[];
  sources: MasterItem[];
  isSidebarOpen: boolean;
  isHydrated: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  hydrateFromServer: () => Promise<void>;
  
  setPtks: (ptks: PTK[]) => void;
  setCandidates: (candidates: Candidate[]) => void;
  
  addPTK: (ptk: Omit<PTK, 'id' | 'created_at'>) => void;
  updatePTK: (id: string, ptk: Partial<PTK>) => void;
  deletePTK: (id: string) => void;
  
  addCandidate: (candidate: Omit<Candidate, 'id' | 'created_at'>) => void;
  updateCandidate: (id: string, candidate: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  importExcelData: (ptks: Omit<PTK, 'id' | 'created_at'>[], candidates: Omit<Candidate, 'id' | 'created_at'>[]) => void;

  // Master Data Methods
  addMasterData: (type: 'departments' | 'recruiters' | 'pics' | 'reasons' | 'sources', name: string) => void;
  updateMasterData: (type: 'departments' | 'recruiters' | 'pics' | 'reasons' | 'sources', id: string, name: string, status: 'Active' | 'Inactive') => void;
  deleteMasterData: (type: 'departments' | 'recruiters' | 'pics' | 'reasons' | 'sources', id: string) => void;
}

const loadStateFromStorage = <T,>(key: string, defaultData: T[]): T[] => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {
      localStorage.removeItem(key);
    }
  }
  return defaultData;
};

const saveStateToStorage = <T,>(key: string, value: T[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const apiJson = async <T,>(url: string, init?: RequestInit): Promise<T | null> => {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let details = '';
    try {
      details = JSON.stringify(await response.json());
    } catch {
      details = await response.text().catch(() => '');
    }
    console.error(`API request failed: ${response.status} ${url}`, details);
    return null;
  }
  return response.json();
};

const defaultDepartments: MasterItem[] = [
  { id: '1', name: 'AC', status: 'Active', created_at: new Date().toISOString() },
  { id: '2', name: 'Accounting', status: 'Active', created_at: new Date().toISOString() },
  { id: '3', name: 'HRD', status: 'Active', created_at: new Date().toISOString() },
  { id: '4', name: 'IT', status: 'Active', created_at: new Date().toISOString() },
  { id: '5', name: 'Maintenance', status: 'Active', created_at: new Date().toISOString() }
];

const defaultRecruiters: MasterItem[] = [
  { id: '1', name: 'Azmi', status: 'Active', created_at: new Date().toISOString() },
  { id: '2', name: 'Ayu Della', status: 'Active', created_at: new Date().toISOString() },
  { id: '3', name: 'Zefry', status: 'Active', created_at: new Date().toISOString() },
  { id: '4', name: 'Amel', status: 'Active', created_at: new Date().toISOString() }
];

const defaultPics: MasterItem[] = [
  { id: '1', name: 'Abdul Ghofur', status: 'Active', created_at: new Date().toISOString() },
  { id: '2', name: 'Agus Wiyanto', status: 'Active', created_at: new Date().toISOString() },
];

const defaultReasons: MasterItem[] = [
  { id: '1', name: 'Penambahan', status: 'Active', created_at: new Date().toISOString() },
  { id: '2', name: 'Pergantian (EoC)', status: 'Active', created_at: new Date().toISOString() },
  { id: '3', name: 'Pergantian (Mutasi)', status: 'Active', created_at: new Date().toISOString() },
  { id: '4', name: 'Pergantian (Resign)', status: 'Active', created_at: new Date().toISOString() },
  { id: '5', name: 'Lainnya', status: 'Active', created_at: new Date().toISOString() },
];

const defaultSources: MasterItem[] = [
  { id: '1', name: 'Internal', status: 'Active', created_at: new Date().toISOString() },
  { id: '2', name: 'Referal (ERP)', status: 'Active', created_at: new Date().toISOString() },
  { id: '3', name: 'Job Street', status: 'Active', created_at: new Date().toISOString() },
  { id: '4', name: 'Glints', status: 'Active', created_at: new Date().toISOString() },
  { id: '5', name: 'Google form', status: 'Active', created_at: new Date().toISOString() },
  { id: '6', name: 'Email', status: 'Active', created_at: new Date().toISOString() },
  { id: '7', name: 'Web Internal', status: 'Active', created_at: new Date().toISOString() },
  { id: '8', name: 'Eksternal Institusi Referal', status: 'Active', created_at: new Date().toISOString() }
];

export const useStore = create<AppState>((set, get) => ({
  ptks: loadStateFromStorage('ptks', []),
  candidates: loadStateFromStorage('candidates', []),
  departments: loadStateFromStorage('master_departments', defaultDepartments),
  recruiters: loadStateFromStorage('master_recruiters', defaultRecruiters),
  pics: loadStateFromStorage('master_pics', defaultPics),
  reasons: loadStateFromStorage('master_reasons', defaultReasons),
  sources: loadStateFromStorage('master_sources', defaultSources),
  isSidebarOpen: false,
  isHydrated: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  hydrateFromServer: async () => {
    const data = await apiJson<{
      ptks: PTK[];
      candidates: Candidate[];
      masterData: (MasterItem & { type: keyof Pick<AppState, 'departments' | 'recruiters' | 'pics' | 'reasons' | 'sources'> })[];
    }>('/api/bootstrap', { cache: 'no-store' });

    if (!data) {
      set({ isHydrated: true });
      return;
    }

    const grouped = {
      departments: data.masterData.filter((item) => item.type === 'departments'),
      recruiters: data.masterData.filter((item) => item.type === 'recruiters'),
      pics: data.masterData.filter((item) => item.type === 'pics'),
      reasons: data.masterData.filter((item) => item.type === 'reasons'),
      sources: data.masterData.filter((item) => item.type === 'sources'),
    };

    saveStateToStorage('ptks', data.ptks);
    saveStateToStorage('candidates', data.candidates);
    saveStateToStorage('master_departments', grouped.departments);
    saveStateToStorage('master_recruiters', grouped.recruiters);
    saveStateToStorage('master_pics', grouped.pics);
    saveStateToStorage('master_reasons', grouped.reasons);
    saveStateToStorage('master_sources', grouped.sources);

    set({
      ptks: data.ptks,
      candidates: data.candidates,
      ...grouped,
      isHydrated: true,
    });
  },
  
  setPtks: (ptks) => set({ ptks }),
  setCandidates: (candidates) => set({ candidates }),
  
  addPTK: (ptk) => {
    const id = generateId();
    const newPtk = { ...ptk, kontrak: ptk.no_ptk ? 'Bulanan' : ptk.kontrak, id, created_at: new Date().toISOString() };
    const ptks = [...get().ptks, newPtk];
    saveStateToStorage('ptks', ptks);
    set({ ptks });
    apiJson<{ ptk: PTK }>('/api/ptks', { method: 'POST', body: JSON.stringify(newPtk) }).then((data) => {
      if (!data) {
        const rolledBack = get().ptks.filter((item) => item.id !== id);
        saveStateToStorage('ptks', rolledBack);
        set({ ptks: rolledBack });
        return;
      }
      const synced = get().ptks.map((item) => item.id === id ? data.ptk : item);
      saveStateToStorage('ptks', synced);
      set({ ptks: synced });
    });
  },
  updatePTK: (id, ptkUpdate) => {
    const ptks = get().ptks.map(p => p.id === id ? { ...p, ...ptkUpdate } : p);
    saveStateToStorage('ptks', ptks);
    set({ ptks });
    apiJson<{ ptk: PTK }>(`/api/ptks/${id}`, { method: 'PATCH', body: JSON.stringify(ptkUpdate) }).then((data) => {
      if (!data) {
        get().hydrateFromServer();
        return;
      }
      const synced = get().ptks.map((item) => item.id === id ? data.ptk : item);
      saveStateToStorage('ptks', synced);
      set({ ptks: synced });
    });
  },
  deletePTK: (id) => {
    const ptks = get().ptks.filter(p => p.id !== id);
    saveStateToStorage('ptks', ptks);
    set({ ptks });
    apiJson(`/api/ptks/${id}`, { method: 'DELETE' }).then((data) => {
      if (!data) get().hydrateFromServer();
    });
  },
  
  addCandidate: (candidate) => {
    const id = generateId();
    const newCandidate = { ...candidate, id, created_at: new Date().toISOString() };
    const candidates = [...get().candidates, newCandidate];
    saveStateToStorage('candidates', candidates);
    set({ candidates });
    apiJson<{ candidate: Candidate }>('/api/candidates', { method: 'POST', body: JSON.stringify(newCandidate) }).then((data) => {
      if (!data) {
        const rolledBack = get().candidates.filter((item) => item.id !== id);
        saveStateToStorage('candidates', rolledBack);
        set({ candidates: rolledBack });
        return;
      }
      const synced = get().candidates.map((item) => item.id === id ? data.candidate : item);
      saveStateToStorage('candidates', synced);
      set({ candidates: synced });
    });
  },
  updateCandidate: (id, candidateUpdate) => {
    const candidates = get().candidates.map(c => c.id === id ? { ...c, ...candidateUpdate } : c);
    saveStateToStorage('candidates', candidates);
    set({ candidates });
    apiJson<{ candidate: Candidate }>(`/api/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(candidateUpdate) }).then((data) => {
      if (!data) {
        get().hydrateFromServer();
        return;
      }
      const synced = get().candidates.map((item) => item.id === id ? data.candidate : item);
      saveStateToStorage('candidates', synced);
      set({ candidates: synced });
    });
  },
  deleteCandidate: (id) => {
    const candidates = get().candidates.filter(c => c.id !== id);
    saveStateToStorage('candidates', candidates);
    set({ candidates });
    apiJson(`/api/candidates/${id}`, { method: 'DELETE' }).then((data) => {
      if (!data) get().hydrateFromServer();
    });
  },
  importExcelData: (importedPtks, importedCandidates) => {
    const newPtks = importedPtks.map(p => ({...p, id: generateId(), created_at: new Date().toISOString()}));
    const newCandidates = importedCandidates.map(c => ({...c, id: generateId(), created_at: new Date().toISOString()}));
    
    const ptks = [...get().ptks, ...newPtks as PTK[]];
    const candidates = [...get().candidates, ...newCandidates as Candidate[]];
    
    saveStateToStorage('ptks', ptks);
    saveStateToStorage('candidates', candidates);
    set({ ptks, candidates });
    newPtks.forEach((ptk) => {
      apiJson<{ ptk: PTK }>('/api/ptks', { method: 'POST', body: JSON.stringify(ptk) });
    });
    newCandidates
      .filter((candidate) => candidate.ptk_id !== 'auto-mapped')
      .forEach((candidate) => {
        apiJson<{ candidate: Candidate }>('/api/candidates', { method: 'POST', body: JSON.stringify(candidate) });
      });
  },
  
  addMasterData: (type, name) => {
    const newItem: MasterItem = { id: generateId(), name, status: 'Active', created_at: new Date().toISOString() };
    const items = [...get()[type], newItem];
    saveStateToStorage(`master_${type}`, items);
    set({ [type]: items });
    apiJson<{ item: MasterItem & { type: string } }>('/api/master-data', {
      method: 'POST',
      body: JSON.stringify({ type, name, status: 'Active' }),
    }).then((data) => {
      if (!data) {
        const rolledBack = get()[type].filter((item) => item.id !== newItem.id);
        saveStateToStorage(`master_${type}`, rolledBack);
        set({ [type]: rolledBack });
        return;
      }
      const synced = get()[type].map((item) => item.id === newItem.id ? data.item : item);
      saveStateToStorage(`master_${type}`, synced);
      set({ [type]: synced });
    });
  },
  updateMasterData: (type, id, name, status) => {
    const items = get()[type].map(i => i.id === id ? { ...i, name, status } : i);
    saveStateToStorage(`master_${type}`, items);
    set({ [type]: items });
    apiJson<{ item: MasterItem & { type: string } }>(`/api/master-data/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type, name, status }),
    }).then((data) => {
      if (!data) {
        get().hydrateFromServer();
        return;
      }
      const synced = get()[type].map((item) => item.id === id ? data.item : item);
      saveStateToStorage(`master_${type}`, synced);
      set({ [type]: synced });
    });
  },
  deleteMasterData: (type, id) => {
    const items = get()[type].filter(i => i.id !== id);
    saveStateToStorage(`master_${type}`, items);
    set({ [type]: items });
    apiJson(`/api/master-data/${id}`, { method: 'DELETE' }).then((data) => {
      if (!data) get().hydrateFromServer();
    });
  }
}));

export const initializeStoreListener = () => {
   useStore.getState().hydrateFromServer();
   return () => {};
};

// Helper functions for auto-computed fields
export const getPTKCloseDate = (tgl_acc_ptk: string) => {
    if (!tgl_acc_ptk) return '-';
    const accDate = new Date(tgl_acc_ptk);
    accDate.setDate(accDate.getDate() + 90);
    return accDate.toISOString().split('T')[0];
}

export const getPTKDaysOpen = (ptk: PTK, candidates: Candidate[]) => {
    const openStatus = getPTKStatusLowongan(ptk, candidates);
    if (openStatus === 'Tutup') {
        return '-';
    }
    if (!ptk.tgl_acc_ptk) return 0;
    const accDate = new Date(ptk.tgl_acc_ptk);
    const now = new Date();
    const diffTime = now.getTime() - accDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
}

export const getPTKKekurangan = (ptk: PTK, candidates: Candidate[]) => {
    const hiredCount = candidates.filter(c => c.ptk_id === ptk.id && c.hasil_rekrutmen === 'Diterima').length;
    return Math.max(0, ptk.total_permintaan - hiredCount);
}

export const getPTKStatusLowongan = (ptk: PTK, candidates: Candidate[]) => {
    return getPTKKekurangan(ptk, candidates) > 0 ? 'Buka' : 'Tutup';
}

export const getPTKStatusComputed = (ptk: PTK, candidates: Candidate[]) => {
    if (getPTKStatusLowongan(ptk, candidates) === 'Tutup') return 'Selesai';
    if (!ptk.tgl_acc_ptk) return 'Belum Berlaku';
    const accDate = new Date(ptk.tgl_acc_ptk);
    const now = new Date();
    const diffTime = now.getTime() - accDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 90) return 'Kadaluarsa';
    return 'Berlaku';
}
