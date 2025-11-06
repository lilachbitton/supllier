
// FIX: Manually define types for Vite's `import.meta.env` to resolve TS errors.
// The reference to `vite/client` was not being resolved, so we define the types manually.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_ORIGAMI_USERNAME?: string;
      readonly VITE_ORIGAMI_API_SECRET?: string;
    };
  }
}

import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- Proxy API Configuration ---
const PROXY_API_URL = '/api/proxy';

const ENTITY_CONFIG = {
  client: {
    entity_data_name: 'clients',
    name_fields: {
      firstName: 'Costumers_Details_name',
      lastName: 'fld_1090',
      group: 'g_200',
    },
    address_fields: {
        address: 'fld_1340',
        group: 'g_160',
    },
     whatsapp_fields: {
        phone: 'fld_1632',
        group: 'g_162',
    },
  },
  lead: {
    entity_data_name: 'e_79',
    name_fields: {
      firstName: 'lead_name',
      lastName: 'fld_1054',
      group: 'g_193',
    },
    address_fields: {
        address: 'fld_1339',
        group: 'g_235',
    },
    whatsapp_fields: {
        phone: 'fld_1630',
        group: 'g_162_dup_e_79', // Corrected group based on user-provided JSON data
    },
  },
  subcontractor: {
    entity_data_name: 'e_91',
    name_fields: {
      name: 'fld_1296_dup_e_91',
      group: 'g_200_dup_e_91',
    },
    address_fields: {
      address: 'fld_1340_dup_e_91',
      group: 'g_160_dup_e_91',
    },
    id_fields: {
        subId: 'Costumers_Details_SIC_dup_e_91',
        group: 'g_200_dup_e_91',
    }
  },
};

// --- Interfaces ---
interface Contractor {
    id: string; // subcontractorId
    name: string; // subName
    subId: string;
    address: string; // subAddress
}

interface Project {
    id: string; // projectId
    name: string;
    firstName: string;
    lastName: string;
    address: string; // projectAddress
}

// --- SVG Icons ---
const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Agreement Form Component ---
const AgreementForm: React.FC = () => {
    // State for subcontractors
    const [subcontractors, setSubcontractors] = useState<Contractor[]>([]);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<Contractor | null>(null);
    const [subcontractorSearchTerm, setSubcontractorSearchTerm] = useState('');
    const [isSubcontractorDropdownOpen, setIsSubcontractorDropdownOpen] = useState(false);
    const [loadingSubcontractors, setLoadingSubcontractors] = useState<boolean>(true);
    const [subcontractorError, setSubcontractorError] = useState<string | null>(null);
    const subcontractorDropdownRef = useRef<HTMLDivElement>(null);

    // State for projects (clients)
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
    const [projectError, setProjectError] = useState<string | null>(null);
    const projectDropdownRef = useRef<HTMLDivElement>(null);

    // State for URL params
    const [urlProjectId, setUrlProjectId] = useState<string | null>(null);
    const [urlSubcontractorId, setUrlSubcontractorId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        const subcontractorId = params.get('subcontractorId');
        if (projectId) setUrlProjectId(projectId);
        if (subcontractorId) setUrlSubcontractorId(subcontractorId);
    }, []);

    const fetchApiData = async (config: any, setData: (data: any[]) => void, setLoading: (loading: boolean) => void, setError: (error: string | null) => void, parser: (items: any[]) => any[]) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(PROXY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_data_name: config.entity_data_name, normalized: 1 }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `שגיאת רשת: ${response.statusText}` }));
                throw new Error(errorData.error || `שגיאת רשת: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('התגובה מהשרת אינה תקינה');
            setData(parser(data));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה';
             setError(errorMessage.includes("Server configuration error")
                    ? "שגיאת תצורה בשרת. יש לוודא שמשתני הסביבה הוגדרו כראוי ב-Vercel."
                    : errorMessage);
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const config = ENTITY_CONFIG.subcontractor;
        const parser = (data: any[]): Contractor[] => data.map((item: any) => {
            const nameGroup = item[config.name_fields.group];
            const addressGroup = item[config.address_fields.group];
            const idGroup = item[config.id_fields.group];
            return {
                id: item.id,
                name: nameGroup?.[config.name_fields.name] || '',
                address: addressGroup?.[config.address_fields.address] || '',
                subId: idGroup?.[config.id_fields.subId] || '',
            };
        }).filter(c => c.name);
        fetchApiData(config, setSubcontractors, setLoadingSubcontractors, setSubcontractorError, parser);
    }, []);

    useEffect(() => {
        const config = ENTITY_CONFIG.client;
        const parser = (data: any[]): Project[] => data.map((item: any) => {
            const nameGroup = item[config.name_fields.group];
            const addressGroup = item[config.address_fields.group];
            const firstName = nameGroup?.[config.name_fields.firstName] || '';
            const lastName = nameGroup?.[config.name_fields.lastName] || '';
            return {
                id: item.id,
                name: `${firstName} ${lastName}`.trim(),
                firstName,
                lastName,
                address: addressGroup?.[config.address_fields.address] || '',
            };
        }).filter(p => p.name);
        fetchApiData(config, setProjects, setLoadingProjects, setProjectError, parser);
    }, []);

    // Pre-select project from URL param
    useEffect(() => {
        if (urlProjectId && projects.length > 0) {
            const projectToSelect = projects.find(p => p.id === urlProjectId);
            if (projectToSelect) {
                setSelectedProject(projectToSelect);
                setProjectSearchTerm(projectToSelect.name);
                setIsProjectDropdownOpen(false);
            }
        }
    }, [urlProjectId, projects]);

    // Pre-select subcontractor from URL param
    useEffect(() => {
        if (urlSubcontractorId && subcontractors.length > 0) {
            const subcontractorToSelect = subcontractors.find(s => s.id === urlSubcontractorId);
            if (subcontractorToSelect) {
                setSelectedSubcontractor(subcontractorToSelect);
                setSubcontractorSearchTerm(subcontractorToSelect.name);
                setIsSubcontractorDropdownOpen(false);
            }
        }
    }, [urlSubcontractorId, subcontractors]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (subcontractorDropdownRef.current && !subcontractorDropdownRef.current.contains(event.target as Node)) setIsSubcontractorDropdownOpen(false);
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) setIsProjectDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSubcontractors = useMemo(() => subcontractors.filter(s => s.name.toLowerCase().includes(subcontractorSearchTerm.toLowerCase())), [subcontractorSearchTerm, subcontractors]);
    const filteredProjects = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase())), [projectSearchTerm, projects]);

    const handleSubmit = () => {
        if (selectedSubcontractor && selectedProject) {
            const baseUrl = 'https://priceq-h.vercel.app/#/subcontractor';
            const params = new URLSearchParams({
                projectAddress: selectedProject.address,
                firstName: selectedProject.firstName,
                lastName: selectedProject.lastName,
                subName: selectedSubcontractor.name,
                subId: selectedSubcontractor.subId,
                subAddress: selectedSubcontractor.address,
                subcontractorId: selectedSubcontractor.id,
                projectId: selectedProject.id,
            });
            const finalUrl = `${baseUrl}?${params.toString()}`;
            window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
            alert("אנא בחר קבלן ופרויקט.");
        }
    };

    const renderDropdown = (
        id: string,
        label: string,
        searchTerm: string,
        onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        onFocus: () => void,
        loading: boolean,
        error: string | null,
        isOpen: boolean,
        items: any[],
        onSelectItem: (item: any) => void,
        placeholderText: string,
        disabled: boolean = false
    ) => (
        <div>
            <label htmlFor={id} className="block text-right text-sm font-medium text-slate-600 mb-2">{label}</label>
            <div className="relative">
                <input id={id} type="text" value={searchTerm} onChange={onSearchChange} onFocus={onFocus} placeholder={loading ? 'טוען...' : placeholderText} disabled={loading || !!error || disabled} className="w-full bg-slate-100 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-right pr-10 disabled:opacity-50 disabled:cursor-not-allowed" autoComplete="off" />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">{loading ? <SpinnerIcon /> : <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}</div>
                {isOpen && !disabled && !loading && !error && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {items.length > 0 ? items.map(item => (<li key={item.id} onClick={() => onSelectItem(item)} className="px-4 py-2 text-right text-slate-700 hover:bg-slate-100 cursor-pointer">{item.name}</li>)) : <li className="px-4 py-2 text-right text-slate-500">לא נמצאו תוצאות</li>}
                    </ul>
                )}
            </div>
            {error && <p className="text-red-500 text-sm mt-2 text-right">{error}</p>}
        </div>
    );
    
    return (
        <div className="w-full max-w-md mx-auto relative">
            <h1 className="text-2xl font-bold text-slate-700 mb-6 text-center">הכן הסכם ספק</h1>
            <div className="space-y-6">
                <div ref={subcontractorDropdownRef}>
                    {renderDropdown('subcontractor-search', 'בחר קבלן/ספק', subcontractorSearchTerm, e => { setSubcontractorSearchTerm(e.target.value); setSelectedSubcontractor(null); setIsSubcontractorDropdownOpen(true); }, () => setIsSubcontractorDropdownOpen(true), loadingSubcontractors, subcontractorError, isSubcontractorDropdownOpen, filteredSubcontractors, (item) => { setSelectedSubcontractor(item); setSubcontractorSearchTerm(item.name); setIsSubcontractorDropdownOpen(false); }, 'הקלד לחיפוש קבלן...', !!urlSubcontractorId)}
                </div>
                <div ref={projectDropdownRef}>
                    {renderDropdown('project-search', 'בחר פרויקט', projectSearchTerm, e => { setProjectSearchTerm(e.target.value); setSelectedProject(null); setIsProjectDropdownOpen(true); }, () => setIsProjectDropdownOpen(true), loadingProjects, projectError, isProjectDropdownOpen, filteredProjects, (item) => { setSelectedProject(item); setProjectSearchTerm(item.name); setIsProjectDropdownOpen(false); }, 'הקלד לחיפוש פרויקט...', !!urlProjectId)}
                </div>
                <button onClick={handleSubmit} disabled={!selectedSubcontractor || !selectedProject} className="w-full flex items-center justify-center gap-x-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg px-5 py-3.5 transition-all duration-200 ease-in-out transform active:scale-95 disabled:bg-blue-400 disabled:cursor-not-allowed">
                    הכן הסכם לחתימה
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <main className="bg-slate-50 text-slate-800 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
            <AgreementForm />
        </div>
      </div>
    </main>
  );
};

export default App;