// Team roster data for GDG on Campus
// Data-driven: The implementation reads from this array dynamically

export type Department = 'Leads' | 'TechOps' | 'Media' | 'Logistics' | 'Design';

export interface TeamMember {
    id: string;
    name: string;
    position: string;
    department: Department;
    tags: string[];
    linkedin?: string;
    github?: string;
    avatar?: string;
}

export const DEPARTMENT_COLORS: Record<Department, string> = {
    Leads: '#FFFFFF',
    TechOps: '#2962FF',
    Media: '#FF1744',
    Logistics: '#FFD600',
    Design: '#00E676',
};

export const DEPARTMENT_BAYS: Record<Department, { name: string; description: string }> = {
    Leads: { name: 'Central Pedestal', description: 'Leadership command center' },
    TechOps: { name: 'Server Rack', description: 'Technical operations & development hub' },
    Media: { name: 'Broadcast Deck', description: 'Media production studio' },
    Logistics: { name: 'Command Center', description: 'Logistics coordination ring' },
    Design: { name: 'Floating Gallery', description: 'Creative design space' },
};

function deriveDepartment(position: string): Department {
    const pos = position.toLowerCase();
    if (pos.includes('logistics')) return 'Logistics';
    if (pos.includes('tech-ops') || pos.includes('techops')) return 'TechOps';
    if (pos.includes('media')) return 'Media';
    if (pos.includes('design')) return 'Design';
    if (pos.includes('ai') || pos.includes('web dev') || pos.includes('app dev') || pos.includes('iot')) return 'TechOps';
    return 'Leads';
}

function generateId(name: string, position: string): string {
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${position.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function extractTags(position: string): string[] {
    const tags: string[] = [];
    const pos = position.toLowerCase();
    if (pos.includes('lead')) tags.push('lead');
    if (pos.includes('co-lead')) tags.push('co-lead');
    if (pos.includes('content')) tags.push('content');
    return tags;
}

const rawRoster = [
    { name: 'Rakesh', position: 'Lead' },
    { name: 'Kishore', position: 'Co-lead' },
    { name: 'Venkat', position: 'Logistics Lead' },
    { name: 'Aboorvan', position: 'Logistics Co-Lead' },
    { name: 'Aishwarya A', position: 'Design Lead' },
    { name: 'Akshithaa H', position: 'Design Co-Lead' },
    { name: 'Lokesh JR', position: 'Tech-Ops Lead' },
    { name: 'Prasanna Kumar P', position: 'Tech-Ops Co-Lead' },
    { name: 'Benin AF', position: 'Media Lead' },
    { name: 'Madhusha Harini', position: 'Media Co-Lead' },
    { name: 'Rithika', position: 'Logistics Team' },
    { name: 'M H Haemanth', position: 'Logistics Team' },
    { name: 'Zaara Lawrence', position: 'Logistics Team' },
    { name: 'Sarvesh R', position: 'Logistics Team' },
    { name: 'Steve Anderson', position: 'Logistics Team' },
    { name: 'Haswaanth', position: 'Logistics Team' },
    { name: 'Tejasvi', position: 'Logistics Team' },
    { name: 'sanya', position: 'Logistics Team' },
    { name: 'yuvan', position: 'Logistics Team' },
    { name: 'sai prashanth', position: 'Logistics Team' },
    { name: 'Praveen keshavan P', position: 'Logistics Team' },
    { name: 'Adhith', position: 'Logistics Team' },
    { name: 'Kunal R', position: 'Media Team' },
    { name: 'Reshmitha', position: 'Media Team' },
    { name: 'Mohamed Aseel S', position: 'Media Team' },
    { name: 'S. Arvind harish nataraj', position: 'Media Team' },
    { name: 'Nivedithaa S', position: 'Media-Content Team' },
    { name: 'Sneha S', position: 'Design Team' },
    { name: 'Kamalesh Ravichandran', position: 'Design Team' },
    { name: 'Adithtya K', position: 'Design Team' },
    { name: 'Aishwarya R', position: 'Design Team' },
    { name: 'Neha', position: 'Design Team' },
    { name: 'Vithuna senthilkumar', position: 'Design-Content Team' },
    { name: 'Visweswar Reddy', position: 'Web Dev Lead' },
    { name: 'Lokaa V', position: 'Web Dev Co-Lead' },
    { name: 'Sanjana R', position: 'App Dev Lead' },
    { name: 'Haresh R', position: 'AI Lead' },
    { name: 'Ishana Sabrish', position: 'AI Co-Lead' },
    { name: 'Deepesh O', position: 'IOT Lead' },
    { name: 'Roshan RP', position: 'Tech-Ops Team' },
    { name: 'Prajan B', position: 'Tech-Ops Team' },
    { name: 'Sanjay Kishore', position: 'Tech-Ops Team' },
    { name: 'Lokeshwaraprasad', position: 'Tech-Ops Team' },
    { name: 'Mohith', position: 'Tech-Ops Team' },
    { name: 'A R Saran Raj', position: 'Tech-Ops Team' },
    { name: 'Gokul ranjan', position: 'Tech-Ops Team' },
    { name: 'Harish S', position: 'Tech-Ops Team' },
    { name: 'Prathyush', position: 'Tech-Ops Team' },
    { name: 'Sibhinandhan', position: 'Tech-Ops Team' },
];

export const TEAM_MEMBERS: TeamMember[] = rawRoster.map((member) => ({
    id: generateId(member.name, member.position),
    name: member.name,
    position: member.position,
    department: deriveDepartment(member.position),
    tags: extractTags(member.position),
}));

export function getMembersByDepartment(department: Department): TeamMember[] {
    return TEAM_MEMBERS.filter((m) => m.department === department);
}

export function getAllDepartments(): Department[] {
    return ['Leads', 'TechOps', 'Design', 'Media', 'Logistics'];
}

export function searchMembers(query: string): TeamMember[] {
    const q = query.toLowerCase().trim();
    if (!q) return TEAM_MEMBERS;
    return TEAM_MEMBERS.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q)
    );
}

export const DEPARTMENT_ORDER: Department[] = ['Leads', 'TechOps', 'Design', 'Media', 'Logistics'];

export default TEAM_MEMBERS;
