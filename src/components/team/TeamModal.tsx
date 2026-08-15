import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Linkedin, Github, Mail } from 'lucide-react';
import { useTeamStore } from '@/store/teamStore';
import { DEPARTMENT_COLORS } from '@/data/team';

export default function TeamModal() {
    const { isModalOpen, selectedMember, closeModal } = useTeamStore();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

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

    if (!selectedMember) return null;

    const departmentColor = DEPARTMENT_COLORS[selectedMember.department];

    return (
        <AnimatePresence>
            {isModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                    role="dialog"
                    aria-modal="true"
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

                            <h2 className="text-2xl font-bold text-white text-center mb-1">
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

                            <div className="flex justify-center gap-3">
                                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                                    <Linkedin className="w-5 h-5 text-white/40 group-hover:text-[#0A66C2]" />
                                </button>
                                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                                    <Github className="w-5 h-5 text-white/40 group-hover:text-white" />
                                </button>
                                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                                    <Mail className="w-5 h-5 text-white/40 group-hover:text-[#EA4335]" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
