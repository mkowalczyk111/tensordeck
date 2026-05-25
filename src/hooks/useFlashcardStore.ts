import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { FlashcardGroup, Flashcard, StudyMode } from '../types/models';
import { createNewSrsState } from '../srs/srsEngine';
import { onAuthChange, signInWithGoogle, signOutUser, saveUserData, loadUserData } from '../services/firebase';
import { useLocalStorage } from './useLocalStorage';

function uid(): string { return crypto.randomUUID(); }

const SEED_VERSION = 3; // Bump to force re-seed default modes

export type CardFilter = 'all' | 'new' | 'review' | 'new+review';

export function filterCards(cards: Flashcard[], filter: CardFilter): Flashcard[] {
  const now = Date.now();
  switch (filter) {
    case 'all': return [...cards];
    case 'new': return cards.filter(c => c.srsState.state === 0);
    case 'review': return cards.filter(c => c.srsState.state > 0 && c.srsState.nextReviewTimestamp <= now);
    case 'new+review':
    default: return cards.filter(c => c.srsState.state === 0 || c.srsState.nextReviewTimestamp <= now);
  }
}

function createSeedGroups(): FlashcardGroup[] {
  const mk = (pages: string[]): Flashcard => ({ id: uid(), pages, srsState: createNewSrsState() });
  return [
    {
      id: uid(), name: 'Angielski - Podstawy', activeModeId: 'classic',
      pageLanguages: ['en-US', 'pl-PL'], pageNames: ['Phrase', 'Tłumaczenie'],
      cards: [
        mk(['Good morning', 'Dzień dobry']), mk(['Thank you', 'Dziękuję']),
        mk(['Please', 'Proszę']), mk(['Goodbye', 'Do widzenia']), mk(['Yes', 'Tak']),
      ],
    },
    {
      id: uid(), name: 'Hiszpański - Podstawy', activeModeId: 'classic',
      pageLanguages: ['es-ES', 'pl-PL'], pageNames: ['Palabra', 'Tłumaczenie'],
      cards: [
        mk(['Hola', 'Cześć']), mk(['Gracias', 'Dziękuję']),
        mk(['Por favor', 'Proszę']), mk(['Adiós', 'Do widzenia']),
      ],
    },
  ];
}

function createSeedModes(): StudyMode[] {
  return [
    { id: 'classic', name: 'Klasyczny', steps: [
      { type: 'show_page', pageIndex: 0 },
    ]},
    { id: 'listen-speak', name: 'Audio', steps: [
      { type: 'show_page', pageIndex: 0 },
      { type: 'speak_page', pageIndex: 0, extraPauseMs: 0 },
      { type: 'listen_and_branch', pageIndex: 1, successThreshold: 70, incorrectTtsPageIndex: 1 },
    ]},
  ];
}

export interface FlashcardStore {
  groups: FlashcardGroup[];
  studyModes: StudyMode[];
  activityHeatmap: Record<string, number>;
  isLoading: boolean;
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addGroup: (name: string, languages: string[], pageNames: string[]) => string;
  updateGroup: (group: FlashcardGroup) => void;
  deleteGroup: (groupId: string) => void;
  addFlashcard: (groupId: string, pages: string[]) => string;
  updateFlashcard: (groupId: string, card: Flashcard) => void;
  deleteFlashcard: (groupId: string, cardId: string) => void;
  addStudyMode: (mode: StudyMode) => void;
  deleteStudyMode: (modeId: string) => void;
  resetToDefault: () => void;
  recordActivity: () => void;
  getDueCards: (groupId: string) => Flashcard[];
  getGroupProgress: (groupId: string) => number;
  importState: (json: string) => void;
  exportState: () => string;
}

export function useFlashcardStore(): FlashcardStore {
  const [groups, setGroups] = useLocalStorage<FlashcardGroup[]>('fiszki-groups', []);
  const [studyModes, setStudyModes] = useLocalStorage<StudyMode[]>('fiszki-modes', []);
  const [heatmap, setHeatmap] = useLocalStorage<Record<string, number>>('fiszki-heatmap', {});
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seedVer, setSeedVer] = useLocalStorage<number>('fiszki-seed-ver', 0);

  // Seed on first launch or migrate on version bump
  useEffect(() => {
    if (seedVer < SEED_VERSION) {
      if (seedVer === 0) {
        // First launch
        setGroups(createSeedGroups());
      }
      // Always update default modes on version bump
      setStudyModes(prev => {
        const defaultModes = createSeedModes();
        const customModes = prev.filter(m => m.id !== 'classic' && m.id !== 'listen-speak');
        return [...defaultModes, ...customModes];
      });
      setSeedVer(SEED_VERSION);
    }
    setIsLoading(false);
  }, [seedVer, setGroups, setStudyModes, setSeedVer]);

  // Auth listener
  useEffect(() => onAuthChange(u => setUser(u)), []);

  // Sync from Firestore when user logs in
  useEffect(() => {
    if (!user) return;
    loadUserData(user.uid).then(data => {
      if (data) {
        setGroups(data.groups);
        setStudyModes(data.studyModes);
        setHeatmap(data.activityHeatmap);
      }
    });
  }, [user, setGroups, setStudyModes, setHeatmap]);

  const persist = useCallback((g: FlashcardGroup[], m: StudyMode[], h: Record<string, number>) => {
    if (user) saveUserData(user.uid, { groups: g, studyModes: m, activityHeatmap: h });
  }, [user]);

  const addGroup = useCallback((name: string, languages: string[], pageNames: string[]) => {
    const id = uid();
    const g: FlashcardGroup = { id, name, cards: [], activeModeId: 'classic', pageLanguages: languages, pageNames };
    setGroups(prev => { const next = [...prev, g]; persist(next, studyModes, heatmap); return next; });
    return id;
  }, [setGroups, persist, studyModes, heatmap]);

  const updateGroup = useCallback((group: FlashcardGroup) => {
    setGroups(prev => { const next = prev.map(g => g.id === group.id ? group : g); persist(next, studyModes, heatmap); return next; });
  }, [setGroups, persist, studyModes, heatmap]);

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => { const next = prev.filter(g => g.id !== id); persist(next, studyModes, heatmap); return next; });
  }, [setGroups, persist, studyModes, heatmap]);

  const addFlashcard = useCallback((groupId: string, pages: string[]) => {
    const card: Flashcard = { id: uid(), pages, srsState: createNewSrsState() };
    setGroups(prev => {
      const next = prev.map(g => g.id === groupId ? { ...g, cards: [...g.cards, card] } : g);
      persist(next, studyModes, heatmap); return next;
    });
    return card.id;
  }, [setGroups, persist, studyModes, heatmap]);

  const updateFlashcard = useCallback((groupId: string, card: Flashcard) => {
    setGroups(prev => {
      const next = prev.map(g => g.id === groupId ? { ...g, cards: g.cards.map(c => c.id === card.id ? card : c) } : g);
      persist(next, studyModes, heatmap); return next;
    });
  }, [setGroups, persist, studyModes, heatmap]);

  const deleteFlashcard = useCallback((groupId: string, cardId: string) => {
    setGroups(prev => {
      const next = prev.map(g => g.id === groupId ? { ...g, cards: g.cards.filter(c => c.id !== cardId) } : g);
      persist(next, studyModes, heatmap); return next;
    });
  }, [setGroups, persist, studyModes, heatmap]);

  const addStudyMode = useCallback((mode: StudyMode) => {
    setStudyModes(prev => { const next = [...prev, mode]; persist(groups, next, heatmap); return next; });
  }, [setStudyModes, persist, groups, heatmap]);

  const deleteStudyMode = useCallback((id: string) => {
    setStudyModes(prev => { const next = prev.filter(m => m.id !== id); persist(groups, next, heatmap); return next; });
  }, [setStudyModes, persist, groups, heatmap]);

  const resetToDefault = useCallback(() => {
    const g = createSeedGroups(), m = createSeedModes(), h: Record<string, number> = {};
    setGroups(g); setStudyModes(m); setHeatmap(h); setSeedVer(SEED_VERSION); persist(g, m, h);
  }, [setGroups, setStudyModes, setHeatmap, setSeedVer, persist]);

  const recordActivity = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setHeatmap(prev => {
      const next = { ...prev, [today]: (prev[today] || 0) + 1 };
      persist(groups, studyModes, next); return next;
    });
  }, [setHeatmap, persist, groups, studyModes]);

  const getDueCards = useCallback((groupId: string): Flashcard[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    return filterCards(group.cards, group.studyFilter || 'new+review');
  }, [groups]);

  const getGroupProgress = useCallback((groupId: string): number => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.cards.length === 0) return 0;
    const learned = group.cards.filter(c => c.srsState.repetitions >= 1).length;
    return Math.round((learned / group.cards.length) * 100);
  }, [groups]);

  const signIn = useCallback(async () => { await signInWithGoogle(); }, []);
  const signOut = useCallback(async () => { await signOutUser(); }, []);

  const exportState = useCallback(() => {
    return JSON.stringify({ groups, studyModes, activityHeatmap: heatmap }, null, 2);
  }, [groups, studyModes, heatmap]);

  const importState = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.groups) setGroups(data.groups);
      if (data.studyModes) setStudyModes(data.studyModes);
      if (data.activityHeatmap) setHeatmap(data.activityHeatmap);
    } catch { console.error('Invalid JSON import'); }
  }, [setGroups, setStudyModes, setHeatmap]);

  return {
    groups, studyModes, activityHeatmap: heatmap, isLoading, user,
    signIn, signOut, addGroup, updateGroup, deleteGroup,
    addFlashcard, updateFlashcard, deleteFlashcard,
    addStudyMode, deleteStudyMode, resetToDefault, recordActivity,
    getDueCards, getGroupProgress, importState, exportState,
  };
}
