import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useTeamStore } from '@/store/teamStore';
import { Department, DEPARTMENT_COLORS, getAllDepartments, DEPARTMENT_BAYS } from '@/data/team';

interface TeamFiltersProps {
    className?: string;
}

export default function TeamFilters({ className }: TeamFiltersProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        selectedDepartment,
        setSelectedDepartment,
        searchQuery,
        setSearchQuery,
        clearFilters,
        filteredMembers
    } = useTeamStore();

    const departments = getAllDepartments();

    const handleDepartmentClick = useCallback((dept: Department) => {
        if (selectedDepartment === dept) {
            setSelectedDepartment(null);
        } else {
            setSelectedDepartment(dept);
        }
    }, [selectedDepartment, setSelectedDepartment]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        inputRef.current?.focus();
    }, [setSearchQuery]);

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search team members..."
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all"
                    aria-label="Search team members"
                />
                {searchQuery && (
                    <button
                        onClick={handleClearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-white/40" />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <motion.button
                    onClick={() => setSelectedDepartment(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedDepartment
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                        }`}
                >
                    All ({filteredMembers.length})
                </motion.button>

                {departments.map((dept) => {
                    const color = DEPARTMENT_COLORS[dept];
                    const isSelected = selectedDepartment === dept;
                    const bay = DEPARTMENT_BAYS[dept];

                    return (
                        <motion.button
                            key={dept}
                            onClick={() => handleDepartmentClick(dept)}
                            whileHover={{ scale: 1.05, x: 2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`group relative px-4 py-2 rounded-full text-sm font-medium transition-all border ${isSelected
                                    ? 'text-black'
                                    : 'text-white/70 hover:text-white border-white/10 hover:border-white/20'
                                }`}
                            style={{
                                backgroundColor: isSelected ? color : 'rgba(255,255,255,0.05)',
                                borderColor: isSelected ? color : undefined,
                                boxShadow: isSelected ? `0 0 20px ${color}40` : undefined,
                            }}
                            title={bay.description}
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: isSelected ? 'currentColor' : color }}
                                />
                                {dept}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {(selectedDepartment || searchQuery) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between text-sm text-white/60"
                >
                    <p>
                        Showing <span className="text-white font-medium">{filteredMembers.length}</span> members
                        {selectedDepartment && (
                            <span> in <span className="font-medium" style={{ color: DEPARTMENT_COLORS[selectedDepartment] }}>{selectedDepartment}</span></span>
                        )}
                        {searchQuery && (
                            <span> matching "<span className="text-white">{searchQuery}</span>"</span>
                        )}
                    </p>
                    <button
                        onClick={clearFilters}
                        className="text-white/40 hover:text-white underline underline-offset-2 transition-colors"
                    >
                        Clear all
                    </button>
                </motion.div>
            )}
        </div>
    );
}
