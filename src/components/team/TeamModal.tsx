import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Linkedin, Github, Mail } from 'lucide-react';
import { useTeamStore } from '@/store/teamStore';
import { DEPARTMENT_COLORS } from '@/data/team';

export default function TeamModal() {
    const { isModalOpen, selectedMember, closeModal } = useTeamStore();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [selectedMember?.id]);

    useEffect(() => {
        if (isModalOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isModalOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, closeModal]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeModal();
    }, [closeModal]);

    const departmentColor = selectedMember ? DEPARTMENT_COLORS[selectedMember.department] : '#4285F4';

    return (
        <AnimatePresence>
            {isModalOpen && selectedMember && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="team-modal-member-name"
                >
                    <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                        style={{ boxShadow: `0 0 60px ${departmentColor}30` }}
                    >
                        <div className="h-2 w-full" style={{ background: departmentColor }} />

                        <button
                            ref={closeButtonRef}
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        <div className="p-8 pt-6">
                            {selectedMember.image && !imgError ? (
                                <img
                                    src={selectedMember.image}
                                    alt={selectedMember.name}
                                    onError={() => setImgError(true)}
                                    className="w-24 h-24 mx-auto mb-6 rounded-full object-cover object-top shadow-lg"
                                    style={{
                                        border: `2px solid ${departmentColor}`,
                                        boxShadow: `0 0 25px ${departmentColor}50`,
                                    }}
                                />
                            ) : (
                                <div
                                    className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-bold"
                                    style={{
                                        backgroundColor: `${departmentColor}20`,
                                        border: `2px solid ${departmentColor}`,
                                        color: departmentColor,
                                    }}
                                >
                                    {selectedMember.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <h2 id="team-modal-member-name" className="text-2xl font-bold text-white text-center mb-1">
                                {selectedMember.name}
                            </h2>

                            <p className="text-white/60 text-center mb-2">
                                {selectedMember.position}
                            </p>

                            <div className="flex justify-center mb-6">
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${departmentColor}20`,
                                        color: departmentColor,
                                        border: `1px solid ${departmentColor}40`,
                                    }}
                                >
                                    {selectedMember.department}
                                </span>
                            </div>

                            <div className="flex justify-center items-center gap-3">
                                {selectedMember.linkedin ? (
                                    <a
                                        href={selectedMember.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${selectedMember.name} on LinkedIn`}
                                        className="p-3 rounded-full bg-white/5 hover:bg-[#0A66C2]/20 border border-white/10 hover:border-[#0A66C2] transition-all group"
                                    >
                                        <Linkedin className="w-5 h-5 text-white/60 group-hover:text-[#0A66C2]" aria-hidden="true" />
                                    </a>
                                ) : null}
                                {selectedMember.github ? (
                                    <a
                                        href={selectedMember.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${selectedMember.name} on GitHub`}
                                        className="p-3 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-all group"
                                    >
                                        <Github className="w-5 h-5 text-white/60 group-hover:text-white" aria-hidden="true" />
                                    </a>
                                ) : null}
                                {selectedMember.email ? (
                                    <a
                                        href={`mailto:${selectedMember.email}`}
                                        aria-label={`Email ${selectedMember.name}`}
                                        className="p-3 rounded-full bg-white/5 hover:bg-[#EA4335]/20 border border-white/10 hover:border-[#EA4335] transition-all group"
                                    >
                                        <Mail className="w-5 h-5 text-white/60 group-hover:text-[#EA4335]" aria-hidden="true" />
                                    </a>
                                ) : null}
                                {!selectedMember.linkedin && !selectedMember.github && !selectedMember.email && (
                                    <p className="text-xs text-white/40 font-mono">Contact details coming soon</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
