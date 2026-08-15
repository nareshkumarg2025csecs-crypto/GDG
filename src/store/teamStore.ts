import { create } from 'zustand';
import { Department, TeamMember, TEAM_MEMBERS, getMembersByDepartment } from '@/data/team';

interface TeamStore {
    selectedDepartment: Department | null;
    searchQuery: string;
    selectedMember: TeamMember | null;
    hoveredMemberId: string | null;
    isModalOpen: boolean;
    webglEnabled: boolean;
    reducedMotion: boolean;
    filteredMembers: TeamMember[];

    setSelectedDepartment: (dept: Department | null) => void;
    setSearchQuery: (query: string) => void;
    setSelectedMember: (member: TeamMember | null) => void;
    setHoveredMemberId: (id: string | null) => void;
    openModal: (member: TeamMember) => void;
    closeModal: () => void;
    setWebglEnabled: (enabled: boolean) => void;
    setReducedMotion: (reduced: boolean) => void;
    clearFilters: () => void;
}

function computeFilteredMembers(dept: Department | null, query: string): TeamMember[] {
    let members = TEAM_MEMBERS;
    if (dept) {
        members = getMembersByDepartment(dept);
    }
    if (query.trim()) {
        const q = query.toLowerCase();
        members = members.filter((m) =>
            m.name.toLowerCase().includes(q) ||
            m.position.toLowerCase().includes(q)
        );
    }
    return members;
}

export const useTeamStore = create<TeamStore>()((set, get) => ({
    selectedDepartment: null,
    searchQuery: '',
    selectedMember: null,
    hoveredMemberId: null,
    isModalOpen: false,
    webglEnabled: true,
    reducedMotion: false,
    filteredMembers: TEAM_MEMBERS,

    setSelectedDepartment: (dept) => {
        set({
            selectedDepartment: dept,
            filteredMembers: computeFilteredMembers(dept, get().searchQuery)
        });
    },

    setSearchQuery: (query) => {
        set({
            searchQuery: query,
            filteredMembers: computeFilteredMembers(get().selectedDepartment, query)
        });
    },

    setSelectedMember: (member) => set({ selectedMember: member }),
    setHoveredMemberId: (id) => set({ hoveredMemberId: id }),
    openModal: (member) => set({ selectedMember: member, isModalOpen: true }),
    closeModal: () => set({ isModalOpen: false }),
    setWebglEnabled: (enabled) => set({ webglEnabled: enabled }),
    setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
    clearFilters: () => set({
        selectedDepartment: null,
        searchQuery: '',
        filteredMembers: TEAM_MEMBERS
    }),
}));

export default useTeamStore;
