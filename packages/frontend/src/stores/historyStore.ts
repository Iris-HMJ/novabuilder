import { create } from 'zustand';
import type { AppDefinition } from '@novabuilder/shared';

const MAX_HISTORY_SIZE = 50;

interface HistoryState {
  undoStack: AppDefinition[];
  redoStack: AppDefinition[];

  // Actions
  pushState: (definition: AppDefinition) => void;
  undo: () => AppDefinition | null;
  redo: () => AppDefinition | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushState: (definition) => {
    set((state) => {
      const newUndoStack = [...state.undoStack, definition];
      // Limit stack size
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift();
      }
      return {
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new action
      };
    });
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return null;

    const newUndoStack = [...undoStack];
    const previousState = newUndoStack.pop()!;

    // Note: The actual state update is handled by the component using this store
    // This store just manages the stack, the component needs to apply the state

    set({
      undoStack: newUndoStack,
      redoStack: redoStack,
    });

    return previousState;
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return null;

    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop()!;

    set({
      undoStack: undoStack,
      redoStack: newRedoStack,
    });

    return nextState;
  },

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,

  clear: () => set({ undoStack: [], redoStack: [] }),
}));

// Helper hook to sync with editor store
import { useEditorStore } from './editorStore';

// This function should be called before any state-changing action in editorStore
// It saves the current state to history before making changes
export const saveToHistory = () => {
  const { appDefinition } = useEditorStore.getState();
  useHistoryStore.getState().pushState(JSON.parse(JSON.stringify(appDefinition)));
};

// Wrapper to perform action with history
export const performWithHistory = <T>(
  action: () => T,
  _undoAction?: () => void
): T => {
  // Save current state before making changes
  saveToHistory();

  // Perform the action
  const result = action();

  return result;
};
