import { motion } from 'framer-motion';
import { useTeamStore } from '@/store/teamStore';
import { DEPARTMENT_COLORS, TEAM_MEMBERS } from '@/data/team';

interface TeamGridFallbackProps {
    className?: string;
}

export default function TeamGridFallback({ className }: TeamGridFallbackProps) {
    const { filteredMembers, openModal, hoveredMemberId, setHoveredMemberId } = useTeamStore();

    return (
        <div className={`${className}`}>
            <a
                href="#team-grid"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
            >
                Skip to team roster
            </a>

            <div
                id="team-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                role="list"
                aria-label="Team members"
            >
                {filteredMembers.map((member, index) => {
                    const color = DEPARTMENT_COLORS[member.department];
                    const isHovered = hoveredMemberId === member.id;

                    return (
                        <motion.button
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.3 }}
                            onClick={() => openModal(member)}
                            onMouseEnter={() => setHoveredMemberId(member.id)}
                            onMouseLeave={() => setHoveredMemberId(null)}
                            onFocus={() => setHoveredMemberId(member.id)}
                            onBlur={() => setHoveredMemberId(null)}
                            className={`group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111112] ${isHovered
                                    ? 'bg-white/10 border-white/20 scale-[1.02]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                            style={{
                                boxShadow: isHovered ? `0 0 30px ${color}30` : undefined,
                            }}
                            role="listitem"
                            aria-label={`${member.name}, ${member.position}`}
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3 transition-transform group-hover:scale-110"
                                style={{
                                    backgroundColor: `${color}20`,
                                    border: `2px solid ${color}`,
                                    color: color,
                                }}
                            >
                                {member.name.charAt(0).toUpperCase()}
                            </div>

                            <h3 className="text-white font-medium text-sm text-center truncate w-full">
                                {member.name}
                            </h3>

                            <p className="text-white/50 text-xs text-center truncate w-full mt-1">
                                {member.position}
                            </p>

                            <div
                                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                                title={member.department}
                            />
                        </motion.button>
                    );
                })}
            </div>

            {filteredMembers.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <p className="text-white/60 text-lg">No team members found</p>
                    <p className="text-white/40 text-sm mt-2">Try adjusting your search or filters</p>
                </motion.div>
            )}

            <p className="text-center text-white/40 text-sm mt-6">
                Showing {filteredMembers.length} of {TEAM_MEMBERS.length} team members
            </p>
        </div>
    );
}
