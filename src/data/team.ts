// ============================================================================
// GDG ON CAMPUS - TEAM ROSTER & POSITION CONFIGURATION
// ============================================================================
// HOW TO ADD / EDIT TEAM DETAILS:
// 1. Edit the member entries in the `rawTeamRoster` array below.
// 2. To add an image:
//    - Place the image file (.jpg / .png / .webp) inside `/public/team/`
//    - Set `image: '/team/your-file-name.jpg'`
//    - This serves the image locally, consuming ZERO Supabase storage egress.
//    - If no image is provided, a sleek monogram avatar with Google brand glow displays automatically.
// 3. To add social links:
//    - Set `email: 'name@college.edu'` (opens mail client directly)
//    - Set `linkedin: 'https://linkedin.com/in/username'` (opens LinkedIn profile)
// ============================================================================

export type Department = 'Leads' | 'TechOps' | 'Media' | 'Logistics' | 'Design';
export type TeamId = 'leads' | 'techops' | 'design' | 'media' | 'logistics';

export interface TeamMember {
    id: string;
    numId: number;
    name: string;
    position: string;
    role: string; // alias for position for component compatibility
    department: Department;
    team: TeamId;
    codename: string;
    color: string;
    initial: string;
    status: 'ACTIVE' | 'STANDBY';
    tags: string[];
    isLead: boolean;
    email: string;
    linkedin: string;
    github?: string;
    image: string; // Local static path: e.g. "/team/filename.png"
}

export interface TeamSection {
    id: TeamId;
    name: string;
    label: string;
    color: string;
    description: string;
    scrollDirection: 'left-to-right' | 'right-to-left';
}

export interface DepartmentDetail {
    id: TeamId;
    name: string;
    code: string;
    color: string;
    subtitle: string;
    description: string;
    mandates: string[];
}

export const DEPARTMENT_DETAILS: DepartmentDetail[] = [
    {
        id: 'leads',
        name: 'LEADERSHIP COMMAND',
        code: '// STRATEGIC DIRECTION',
        color: '#9E9E9E',
        subtitle: 'Core Chapter Direction & Community Vision',
        description: 'Oversees organizational roadmap, partnerships, university collaboration, and campus-wide developer enablement.',
        mandates: ['Community Strategy', 'Ecosystem Partnerships', 'Cross-Team Synchronization'],
    },
    {
        id: 'techops',
        name: 'TECHNICAL OPERATIONS',
        code: '// ARCHITECTS & CODE MASTERS',
        color: '#4285F4',
        subtitle: 'Engineering, Cloud, AI & Specialized Tech Domains',
        description: 'Architects and scales high-performance web platforms, cloud backends, machine learning pipelines, and technical workshops.',
        mandates: ['Full-Stack Web & App Engineering', 'Artificial Intelligence & ML', 'DevOps & Cloud Infrastructure'],
    },
    {
        id: 'design',
        name: 'VISUAL SYSTEMS & DESIGN',
        code: '// CREATIVE SYSTEMS',
        color: '#EA4335',
        subtitle: 'UI/UX Architecture & Brand Identity',
        description: 'Crafts cohesive digital product experiences, modern cyber aesthetics, branding guidelines, and visual communication.',
        mandates: ['Design Systems & Figma UI/UX', 'Brand Communication', 'Event Visual Production'],
    },
    {
        id: 'media',
        name: 'MEDIA & BROADCASTING',
        code: '// CONTENT OPERATIONS',
        color: '#FBBC04',
        subtitle: 'Photography, Video & Community Resonance',
        description: 'Captures high-fidelity event visual records, produces educational tech media, and drives global developer outreach.',
        mandates: ['Broadcast & Video Production', 'Developer Storytelling', 'Social & Digital Reach'],
    },
    {
        id: 'logistics',
        name: 'OPERATIONS & EVENTS',
        code: '// EXECUTION INFRASTRUCTURE',
        color: '#34A853',
        subtitle: 'Event Planning, Outreach & Logistics',
        description: 'Coordinates physical infrastructure, attendee registration flows, safety protocols, and flawless hackathon execution.',
        mandates: ['Campus Venue & AV Coordination', 'Attendee Operations & Check-in', 'Outreach & Sponsorship Logistics'],
    },
];

export const DEPARTMENT_COLORS: Record<Department, string> = {
    Leads: '#9E9E9E',
    TechOps: '#4285F4',
    Media: '#FBBC04',
    Logistics: '#34A853',
    Design: '#EA4335',
};

export const DEPARTMENT_BAYS: Record<Department, { name: string; description: string }> = {
    Leads: { name: 'Central Pedestal', description: 'Leadership command center' },
    TechOps: { name: 'Server Rack', description: 'Technical operations & development hub' },
    Media: { name: 'Broadcast Deck', description: 'Media production studio' },
    Logistics: { name: 'Command Center', description: 'Logistics coordination ring' },
    Design: { name: 'Floating Gallery', description: 'Creative design space' },
};

export const TEAM_SECTIONS: TeamSection[] = [
    { id: 'leads', name: 'LEADS', label: '// LEADERSHIP', color: '#9E9E9E', description: 'GDG on Campus leadership team', scrollDirection: 'left-to-right' },
    { id: 'logistics', name: 'EVENTS & OPERATIONS', label: '// EVENTS & OPERATIONS', color: '#34A853', description: 'Event planning, outreach & logistics execution masters', scrollDirection: 'left-to-right' },
    { id: 'design', name: 'DESIGN', label: '// VISUAL SYSTEMS', color: '#EA4335', description: 'UI/UX & brand identity specialists', scrollDirection: 'left-to-right' },
    { id: 'media', name: 'MEDIA', label: '// CONTENT OPS', color: '#FBBC04', description: 'Photography, video & social resonance', scrollDirection: 'left-to-right' },
    { id: 'techops', name: 'TECH OPS', label: '// TECHNICAL OPERATIONS', color: '#4285F4', description: 'Backend architects & code masters', scrollDirection: 'left-to-right' },
];

interface RawMemberEntry {
    name: string;
    position: string;
    team: TeamId;
    department: Department;
    codename: string;
    color: string;
    status?: 'ACTIVE' | 'STANDBY';
    email?: string;
    linkedin?: string;
    github?: string;
    image?: string; // Path in /public/team/ (e.g. '/team/name.jpg')
}

// ============================================================================
// RAW TEAM ROSTER - OFFICIAL GDG ON CAMPUS CLUB ROSTER
// ============================================================================
const rawTeamRoster: RawMemberEntry[] = [
    // ------------------------------------------------------------------------
    // 1. LEADERSHIP
    // ------------------------------------------------------------------------
    {
        name: 'Nivedithaa S',
        position: 'Lead',
        team: 'leads',
        department: 'Leads',
        codename: 'ORBIT',
        color: '#9E9E9E',
        status: 'ACTIVE',
        email: 'nivedithaa.s.2024.csecs@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/nivedithaa-s/',
        github: '',
        image: '/team/nivedithaa.png',
    },
    {
        name: 'Mohamed Aseel',
        position: 'Co-Lead',
        team: 'leads',
        department: 'Leads',
        codename: 'PULSE',
        color: '#9E9E9E',
        status: 'ACTIVE',
        email: 'mohamedaseel.s.2024.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/mohamed-aseel-3b0933331',
        github: '',
        image: '/team/aseel.png',
    },
    {
        name: 'Mohith O',
        position: 'Co-Lead',
        team: 'leads',
        department: 'Leads',
        codename: 'CIPHER',
        color: '#9E9E9E',
        status: 'ACTIVE',
        email: 'mohith.o.2024.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/mohithexe',
        github: '',
        image: '/team/mohith.png',
    },

    // ------------------------------------------------------------------------
    // 2. TECH-OPS (DEVELOPMENT, AI/ML, IOT)
    // ------------------------------------------------------------------------
    {
        name: 'Harish S',
        position: 'Tech-Ops Lead',
        team: 'techops',
        department: 'TechOps',
        codename: 'MATRIX',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'harish.s2.2024.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/harish-s-339b3a331?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/harish.png',
    },
    {
        name: 'Kamalesh R',
        position: 'Web/App Dev Lead',
        team: 'techops',
        department: 'TechOps',
        codename: 'VECTOR',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'kamalesh.r.2024.csbs@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/kamalesh-ravichandran-497726325',
        github: '',
        image: '/team/kamalesh.png',
    },
    {
        name: 'Gayathri Boopathy',
        position: 'Web Dev Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'PIXEL',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'gayathriboopathy.2024.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/gayathri-boopathy-611158334',
        github: '',
        image: '/team/gayathri_boopathy.png',
    },
    {
        name: 'Naresh Kumar G',
        position: 'Web Dev Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'KERNEL',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'nareshkumar.g.2025.csecs@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/naresh-kumar-g-31264939a?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/naresh.png',
    },
    {
        name: 'Mohammed Sabithulla Sharieff M',
        position: 'App Dev Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'APEX',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'mohammedsabithullasharieff.m.2024.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/sabithullasharieff',
        github: '',
        image: '/team/sabithulla.png',
    },
    {
        name: 'Raghul K',
        position: 'App Dev Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'NEXUS',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'raghul.k.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/raghul-k-b95912399/',
        github: '',
        image: '/team/raghul.png',
    },
    {
        name: 'Harshini U',
        position: 'AI/ML Lead',
        team: 'techops',
        department: 'TechOps',
        codename: 'TENSOR',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'harshini.u.2024.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/harshiniudayakumar/',
        github: '',
        image: '/team/harshini.png',
    },
    {
        name: 'Abhishiek S',
        position: 'AI/ML Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'NEURAL',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'abhishiek.s.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/abhishiek-sankaranarayanan-672621397/',
        github: '',
        image: '/team/abhishiek.png',
    },
    {
        name: 'Harsha Vardhini S',
        position: 'AI/ML Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'SYNAPSE',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'harshavardhini.s.2024.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/harsha-vardhini-s-478971330/',
        github: '',
        image: '/team/harshavardhini.png',
    },
    {
        name: 'Sheshashree Arunkumar',
        position: 'AI/ML Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'LOGIC',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'sheshashreearunkumar.2025.aiml@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/sh-ak/',
        github: '',
        image: '/team/sheshashree.png',
    },
    {
        name: 'Vihith D',
        position: 'IOT Lead',
        team: 'techops',
        department: 'TechOps',
        codename: 'GATEWAY',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'vihith.d.2024.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/vihith-d-467946331',
        github: '',
        image: '/team/vihith.png',
    },
    {
        name: 'Raghav S',
        position: 'IOT Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'CIRCUIT',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'raghav.s.2025.mech@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/raghavsenthilkumar/',
        github: '',
        image: '/team/raghav.png',
    },
    {
        name: 'Rohitha N',
        position: 'IOT Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'SIGNAL',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'rohitha.n.2025.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/rohitha-n-2116b838a',
        github: '',
        image: '/team/rohitha.png',
    },
    {
        name: 'Yogeeshwaran C',
        position: 'IOT Associate',
        team: 'techops',
        department: 'TechOps',
        codename: 'QUANTUM',
        color: '#4285F4',
        status: 'ACTIVE',
        email: 'yogeeshwaran.c.2025.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/yogeeshwaran-chandru-252690394',
        github: '',
        image: '/team/yogeeshwaran.png',
    },

    // ------------------------------------------------------------------------
    // 3. DESIGN & CREATIVE
    // ------------------------------------------------------------------------
    {
        name: 'Sneha S',
        position: 'Design Lead',
        team: 'design',
        department: 'Design',
        codename: 'CANVAS',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'sneha.s.2024.csd@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/me?trk=p_mwlite_feed-secondary_nav',
        github: '',
        image: '/team/sneha.png',
    },
    {
        name: 'Aishwarya R',
        position: 'Design Co-Lead',
        team: 'design',
        department: 'Design',
        codename: 'PRISM',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'aishwarya.r.2024.aiml@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/aishwaryaramanathan17?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/aishwarya.png',
    },
    {
        name: 'Adithtya K',
        position: 'Creative Lead',
        team: 'design',
        department: 'Design',
        codename: 'AURA',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'adithtya.k.2024.csd@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/adithtya-k-726b23375',
        github: '',
        image: '/team/adithtya_k.png',
    },
    {
        name: 'Gowshik K',
        position: 'Design Associate',
        team: 'design',
        department: 'Design',
        codename: 'STROKE',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'gowshik.k.2025.aids@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/gowshik-k-3693b9381?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/gowshik.png',
    },
    {
        name: 'Pavithra M.D',
        position: 'Design Associate',
        team: 'design',
        department: 'Design',
        codename: 'SHADOW',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'pavithra.md.2025.aids@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/pavithra-m-d-0b62a33a2?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/pavithra.png',
    },
    {
        name: 'Pooja K',
        position: 'Design Associate',
        team: 'design',
        department: 'Design',
        codename: 'LAYER',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'pooja.k.2025.csd@rajalakshmi.edu.in',
        linkedin: 'www.linkedin.com/in/pooja-k-digital-company',
        github: '',
        image: '/team/pooja.png',
    },
    {
        name: 'Varshene R',
        position: 'Design Associate',
        team: 'design',
        department: 'Design',
        codename: 'VIVID',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'varshene.r.2025.csd@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/varshene-r-b39488330',
        github: '',
        image: '/team/varshene.png',
    },
    {
        name: 'Vishwathi',
        position: 'Design Associate',
        team: 'design',
        department: 'Design',
        codename: 'SPECTRUM',
        color: '#EA4335',
        status: 'ACTIVE',
        email: 'vishwathi.be.2025.bt@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/vishwathi-b-e-aa9a403b4/',
        github: '',
        image: '/team/vishwathi.png',
    },

    // ------------------------------------------------------------------------
    // 4. MEDIA & BROADCAST
    // ------------------------------------------------------------------------
    {
        name: 'Arvind Harish',
        position: 'Media Lead',
        team: 'media',
        department: 'Media',
        codename: 'SHUTTER',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: '',
        linkedin: '',
        github: '',
        image: '/team/arvindharish.png',
    },
    {
        name: 'Adithya',
        position: 'Media Co-lead',
        team: 'media',
        department: 'Media',
        codename: 'FOCUS',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'adithya.n.2024.it@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/adithya-n-881062318?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
        github: '',
        image: '/team/adithya.png',
    },
    {
        name: 'Dilshath D',
        position: 'Media Associate',
        team: 'media',
        department: 'Media',
        codename: 'LENS',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'dilshath.d.2025.csd@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/dilshath-dhavood-489baa398/',
        github: '',
        image: '/team/dilshath.png',
    },
    {
        name: 'Gayathri S',
        position: 'Media Associate',
        team: 'media',
        department: 'Media',
        codename: 'FRAME',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'gayathri.s1.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/gayathrisathishkumar/',
        github: '',
        image: '/team/gayathri.png',
    },
    {
        name: 'Jayant Jyotiranjan R',
        position: 'Media Associate',
        team: 'media',
        department: 'Media',
        codename: 'OPTIC',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'jayantjyotiranjan.r.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/jayant-jyotiranjan-r-7906b7426?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/jayant.png',
    },
    {
        name: 'Rithvika',
        position: 'Media Associate',
        team: 'media',
        department: 'Media',
        codename: 'CHROMA',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'rithvika.b.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/rithvika-b-4730b5396',
        github: '',
        image: '/team/rithvika.png',
    },
    {
        name: 'Shreya Srivatsan',
        position: 'Media Associate',
        team: 'media',
        department: 'Media',
        codename: 'WAVE',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'shreyasrivatsan.2025.aiml@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/shreya-srivatsan-aa2630396',
        github: '',
        image: '/team/shreya.png',
    },
    {
        name: 'Tarun',
        position: 'Media Associate',
        team: 'media',
        department: 'Media',
        codename: 'BEAM',
        color: '#FBBC04',
        status: 'ACTIVE',
        email: 'tarun.c.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/tarun-c-524646424',
        github: '',
        image: '/team/tarun.png',
    },

    // ------------------------------------------------------------------------
    // 5. OPERATIONS, EVENTS & OUTREACH
    // ------------------------------------------------------------------------
    {
        name: 'Subramanian Velavan',
        position: 'Events Lead',
        team: 'logistics',
        department: 'Logistics',
        codename: 'STRIDE',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'subramanianvelavan.2024.cse@rajalakshmi.edu.in',
        linkedin: 'http://www.linkedin.com/in/subramanian-velavan-17sv4s564',
        github: '',
        image: '/team/subramanian.png',
    },
    {
        name: 'Sai Prashanth',
        position: 'Events Co-Lead',
        team: 'logistics',
        department: 'Logistics',
        codename: 'BEACON',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'saiprashanth.v.2024.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/saiprashanth-vijayakumar-63520b318/?isSelfProfile=true',
        github: '',
        image: '/team/saiprashanth.png',
    },
    {
        name: 'Steve Anderson',
        position: 'Outreach Lead',
        team: 'logistics',
        department: 'Logistics',
        codename: 'RADAR',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'steveanderson.p.2024.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/steve-anderson-b1552231a',
        github: '',
        image: '/team/steve.png',
    },
    {
        name: 'Adhith Vaibav',
        position: 'Outreach Co-Lead',
        team: 'logistics',
        department: 'Logistics',
        codename: 'BRIDGE',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'adhithvaibav.rk.2024.ece@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/adhith-vaibav-bb4b54331?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
        github: '',
        image: '/team/adhith.png',
    },
    {
        name: 'Nadira Noorul Nazer',
        position: 'Events Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'CHRONO',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'nadiranoorulnazer.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/nadira-noorul-nazer-21730a442/',
        github: '',
        image: '/team/nadira.png',
    },
    {
        name: 'Poojasri B',
        position: 'Events Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'ANCHOR',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'poojasri.b.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/poojasri-b-70844b409',
        github: '',
        image: '/team/poojasri.png',
    },
    {
        name: 'Poorvika N',
        position: 'Events Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'PULSE',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'poorvika.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/poorvika-nandakumar-537a30394',
        github: '',
        image: '/team/poorvika.png',
    },
    {
        name: 'Sherin A',
        position: 'Events Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'COMPASS',
        color: '#34A853',
        status: 'ACTIVE',
        email: '',
        linkedin: '',
        github: '',
        image: '/team/sherin.png',
    },
    {
        name: 'Shiny K',
        position: 'Events Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'SPARK',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'shiny.k.2025.csecs@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/shinykingsley',
        github: '',
        image: '/team/shiny.png',
    },
    {
        name: 'Adhithya S',
        position: 'Outreach Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'ALLOY',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'adhithya.s.2024.mct@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/adhithya-s-6b5b1b2b9?utm_source=share_via&utm_content=profile&utm_medium=member_android',
        github: '',
        image: '/team/adhithya_s.png',
    },
    {
        name: 'Ayshwarya S',
        position: 'Outreach Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'RELAY',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'ayshwarya.s.2024.aiml@rajalakshmi.edu.in',
        linkedin: 'http://www.linkedin.com/in/ayshwarya-s-17sv4s564',
        github: '',
        image: '/team/ayshwarya.png',
    },
    {
        name: 'Nethra S',
        position: 'Outreach Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'ORBIT',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'nethra.s.2025.csbs@rajalakshmi.edu.in',
        linkedin: '',
        github: '',
        image: '/team/nethra.png',
    },
    {
        name: 'Rounith Arrun Rathesh',
        position: 'Outreach Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'VECTOR',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'rounitharrunrathesh.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/rounithrathesh',
        github: '',
        image: '/team/rounith.png',
    },
    {
        name: 'Sanskriti G',
        position: 'Outreach Associate',
        team: 'logistics',
        department: 'Logistics',
        codename: 'HORIZON',
        color: '#34A853',
        status: 'ACTIVE',
        email: 'sanskriti.g.2025.cse@rajalakshmi.edu.in',
        linkedin: 'https://www.linkedin.com/in/sanskriti-gajapathi-6857bb388',
        github: '',
        image: '/team/sanskriti.png',
    },
];

function generateId(name: string, position: string): string {
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${position.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function extractTags(position: string): string[] {
    const tags: string[] = [];
    const pos = position.toLowerCase();
    if (pos.includes('lead')) tags.push('lead');
    if (pos.includes('co-lead')) tags.push('co-lead');
    if (pos.includes('associate')) tags.push('associate');
    if (pos.includes('content')) tags.push('content');
    return tags;
}

export const TEAM_MEMBERS: TeamMember[] = rawTeamRoster.map((member, index) => {
    const cleanInitial = member.name.trim().charAt(0).toUpperCase() || 'G';
    return {
        id: generateId(member.name, member.position),
        numId: index,
        name: member.name,
        position: member.position,
        role: member.position,
        department: member.department,
        team: member.team,
        codename: member.codename,
        color: member.color,
        initial: cleanInitial,
        status: member.status || 'ACTIVE',
        tags: extractTags(member.position),
        isLead: member.team === 'leads' || member.position.toLowerCase().includes('lead'),
        email: member.email || '',
        linkedin: member.linkedin || '',
        github: member.github || '',
        image: member.image || '',
    };
});

/**
 * HOMEPAGE 2D SHOWCASE - LEADS ONLY
 * Easily customizable list of leads shown on the Home Page 2D Cards view.
 * Displays only leads and co-leads as requested.
 */
export const HOME_LEADS: TeamMember[] = TEAM_MEMBERS.filter((m) => m.isLead);

/**
 * Returns team members grouped by bay for the 3D Garage.
 * Automatically synchronizes real team members with the 3D scene.
 */
export function getGarageMembersByBay(): Record<TeamId, TeamMember[]> {
    return {
        leads: TEAM_MEMBERS.filter((m) => m.team === 'leads'),
        techops: TEAM_MEMBERS.filter((m) => m.team === 'techops' && m.isLead),
        design: TEAM_MEMBERS.filter((m) => m.team === 'design' && m.isLead),
        media: TEAM_MEMBERS.filter((m) => m.team === 'media' && m.isLead),
        logistics: TEAM_MEMBERS.filter((m) => m.team === 'logistics' && m.isLead),
    };
}

export function getMembersByDepartment(department: Department): TeamMember[] {
    return TEAM_MEMBERS.filter((m) => m.department === department);
}

export function getMembersByTeam(team: TeamId): TeamMember[] {
    return TEAM_MEMBERS.filter((m) => m.team === team);
}

export function getAllDepartments(): Department[] {
    return ['Leads', 'TechOps', 'Design', 'Media', 'Logistics'];
}

export function searchMembers(query: string): TeamMember[] {
    const q = query.toLowerCase().trim();
    if (!q) return TEAM_MEMBERS;
    return TEAM_MEMBERS.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        m.codename.toLowerCase().includes(q)
    );
}

export const DEPARTMENT_ORDER: Department[] = ['Leads', 'TechOps', 'Design', 'Media', 'Logistics'];

export const TEAM_DOMAINS: { id: Department; name: string; color: string }[] = [
    { id: 'Leads', name: 'Leadership Command (Leads)', color: '#9E9E9E' },
    { id: 'TechOps', name: 'Technical Operations (TechOps)', color: '#4285F4' },
    { id: 'Design', name: 'Visual Systems & Design (Design)', color: '#EA4335' },
    { id: 'Media', name: 'Media & Broadcasting (Media)', color: '#FBBC04' },
    { id: 'Logistics', name: 'Operations & Events (Logistics)', color: '#34A853' },
];

export const ALL_TEAM_POSITIONS: string[] = Array.from(
    new Set(TEAM_MEMBERS.map((m) => m.position))
);

export const POSITIONS_BY_DOMAIN: Record<Department, string[]> = {
    Leads: Array.from(new Set(TEAM_MEMBERS.filter((m) => m.department === 'Leads').map((m) => m.position))),
    TechOps: Array.from(new Set(TEAM_MEMBERS.filter((m) => m.department === 'TechOps').map((m) => m.position))),
    Design: Array.from(new Set(TEAM_MEMBERS.filter((m) => m.department === 'Design').map((m) => m.position))),
    Media: Array.from(new Set(TEAM_MEMBERS.filter((m) => m.department === 'Media').map((m) => m.position))),
    Logistics: Array.from(new Set(TEAM_MEMBERS.filter((m) => m.department === 'Logistics').map((m) => m.position))),
};

export default TEAM_MEMBERS;
