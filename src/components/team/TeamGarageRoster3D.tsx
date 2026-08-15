import { useMemo } from 'react'
import TeamGarage3D, { BayId, TeamGarageBayMeta, TeamGarageMember, TeamGarageMembersByBay } from '@/components/TeamGarage3D'
import { TEAM_MEMBERS, Department, TeamMember } from '@/data/team'

const DEPARTMENT_TO_BAY: Record<Department, BayId> = {
    Leads: 'leads',
    TechOps: 'techops',
    Design: 'design',
    Media: 'media',
    Logistics: 'logistics',
}

const TEAM_PAGE_BAY_META: TeamGarageBayMeta[] = [
    {
        id: 'leads',
        name: 'LEADS',
        color: '#FFFFFF',
        position: [-6, 0, 0],
    },
    {
        id: 'techops',
        name: 'TECH_OPS',
        color: '#4285F4',
        position: [-3, 0, 0],
    },
    {
        id: 'design',
        name: 'DESIGN',
        color: '#EA4335',
        position: [0, 0, 0],
    },
    {
        id: 'media',
        name: 'MEDIA',
        color: '#FBBC04',
        position: [3, 0, 0],
    },
    {
        id: 'logistics',
        name: 'LOGISTICS',
        color: '#34A853',
        position: [6, 0, 0],
    },
]

function buildMembersByBay(members: TeamMember[]): TeamGarageMembersByBay {
    const byBay: Record<BayId, TeamGarageMember[]> = {
        leads: [],
        techops: [],
        design: [],
        media: [],
        logistics: [],
    }

    members.forEach((member) => {
        const isLeadRole = member.position.toLowerCase().includes('lead')
        if (!isLeadRole) return
        const bay = DEPARTMENT_TO_BAY[member.department]
        byBay[bay].push({
            id: member.id,
            name: member.name,
            role: member.position,
        })
    })

    return byBay
}

export default function TeamGarageRoster3D() {
    const membersByBay = useMemo(() => buildMembersByBay(TEAM_MEMBERS), [TEAM_MEMBERS])
    return (
        <TeamGarage3D
            membersByBay={membersByBay}
            layoutMode="grid"
            bayMeta={TEAM_PAGE_BAY_META}
            cameraConfig={{ fov: 62, overviewY: 0.9, overviewZ: 8, focusZ: 3.6 }}
        />
    )
}
