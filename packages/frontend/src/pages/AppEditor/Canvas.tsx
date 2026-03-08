import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Menu } from 'antd';
import {
  CopyOutlined,
  ScissorOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BorderOutlined,
  ColumnHeightOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import { registry } from '../../registry';
import type { ComponentNode, ComponentType } from '@novabuilder/shared';

const GRID_SIZE = 8;
const MIN_SIZE = 24;
const ALIGNMENT_THRESHOLD = 5;

interface DragState {
  isDragging: boolean;
  componentId: string | null;
  startX: number;
  startY: number;
  startComponentX: number;
  startComponentY: number;
}

interface ResizeState {
  isResizing: boolean;
  componentId: string | null;
  handle: string | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startCompX: number;
  startCompY: number;
}

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  componentId: string;
}

interface CanvasProps {
  isDraggingFromPanel: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ isDraggingFromPanel }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Canvas state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Drag state for moving components
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    componentId: null,
    startX: 0,
    startY: 0,
    startComponentX: 0,
    startComponentY: 0,
  });

  // Resize state
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    componentId: null,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startCompX: 0,
    startCompY: 0,
  });

  // Selection box for multi-select
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Alignment guides
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);

  // Store
  const {
    appDefinition,
    currentPageId,
    selectedComponentIds,
    zoom,
    panOffset,
    selectComponent,
    clearSelection,
    addComponent,
    moveComponent,
    deleteComponent,
    duplicateComponent,
    updateComponentStyle,
    setZoom,
    setPanOffset,
    mode,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = useEditorStore();

  const { pushState } = useHistoryStore();

  const currentPage = appDefinition.pages.find((p) => p.id === currentPageId);
  const components = currentPage?.components || [];

  // Snap to grid
  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Get all alignment guides for current components
  const calculateAlignmentGuides = useCallback((movingComp: ComponentNode, x: number, y: number, width: number, height: number): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];
    const otherComps = components.filter(c => c.id !== movingComp.id && selectedComponentIds.includes(c.id));

    const movingLeft = x;
    const movingRight = x + width;
    const movingTop = y;
    const movingBottom = y + height;
    const movingHCenter = x + width / 2;
    const movingVCenter = y + height / 2;

    otherComps.forEach(comp => {
      const compLeft = comp.style.x;
      const compRight = comp.style.x + comp.style.width;
      const compTop = comp.style.y;
      const compBottom = comp.style.y + comp.style.height;
      const compHCenter = comp.style.x + comp.style.width / 2;
      const compVCenter = comp.style.y + comp.style.height / 2;

      // Left alignment
      if (Math.abs(movingLeft - compLeft) <= ALIGNMENT_THRESHOLD) {
        guides.push({ type: 'vertical', position: compLeft, componentId: comp.id });
      }
      // Right alignment
      if (Math.abs(movingRight - compRight) <= ALIGNMENT_THRESHOLD) {
        guides.push({ type: 'vertical', position: compRight, componentId: comp.id });
      }
      // Horizontal center alignment
      if (Math.abs(movingHCenter - compHCenter) <= ALIGNMENT_THRESHOLD) {
        guides.push({ type: 'vertical', position: compHCenter, componentId: comp.id });
      }
      // Top alignment
      if (Math.abs(movingTop - compTop) <= ALIGNMENT_THRESHOLD) {
        guides.push({ type: 'horizontal', position: compTop, componentId: comp.id });
      }
      // Bottom alignment
      if (Math.abs(movingBottom - compBottom) <= ALIGNMENT_THRESHOLD) {
        guides.push({ type: 'horizontal', position: compBottom, componentId: comp.id });
      }
      // Vertical center alignment
      if (Math.abs(movingVCenter - compVCenter) <= ALIGNMENT_THRESHOLD) {
        guides.push({ type: 'horizontal', position: compVCenter, componentId: comp.id });
      }
    });

    return guides;
  }, [components, selectedComponentIds]);

  // Get snap position including alignment
  const getSnapPosition = useCallback((x: number, y: number, width: number, height: number, compId: string): { x: number; y: number } => {
    const movingComp = components.find(c => c.id === compId);
    if (!movingComp) return { x: snapToGrid(x), y: snapToGrid(y) };

    const guides = calculateAlignmentGuides(movingComp, x, y, width, height);

    let snapX = x;
    let snapY = y;

    guides.forEach(guide => {
      if (guide.type === 'vertical') {
        const movingLeft = x;
        const movingRight = x + width;
        const movingHCenter = x + width / 2;
        const compLeft = guide.position;
        const compRight = guide.position;
        const compHCenter = guide.position;

        if (Math.abs(movingLeft - compLeft) <= ALIGNMENT_THRESHOLD) {
          snapX = guide.position;
        } else if (Math.abs(movingRight - compRight) <= ALIGNMENT_THRESHOLD) {
          snapX = guide.position - width;
        } else if (Math.abs(movingHCenter - compHCenter) <= ALIGNMENT_THRESHOLD) {
          snapX = guide.position - width / 2;
        }
      } else {
        const movingTop = y;
        const movingBottom = y + height;
        const movingVCenter = y + height / 2;
        const compTop = guide.position;
        const compBottom = guide.position;
        const compVCenter = guide.position;

        if (Math.abs(movingTop - compTop) <= ALIGNMENT_THRESHOLD) {
          snapY = guide.position;
        } else if (Math.abs(movingBottom - compBottom) <= ALIGNMENT_THRESHOLD) {
          snapY = guide.position - height;
        } else if (Math.abs(movingVCenter - compVCenter) <= ALIGNMENT_THRESHOLD) {
          snapY = guide.position - height / 2;
        }
      }
    });

    return { x: snapToGrid(snapX), y: snapToGrid(snapY) };
  }, [components, calculateAlignmentGuides, snapToGrid]);

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, setZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, CodeMirror editor, or any focused element
      const target = e.target as HTMLElement;
      const activeElement = document.activeElement;

      // Check if CodeMirror is focused
      if (activeElement?.closest('.cm-editor')) {
        return;
      }

      // Check input/textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check contentEditable
      if (target.isContentEditable) {
        return;
      }

      // Track space key for panning
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if (mode !== 'edit') return;

      // Delete/Backspace - delete selected components
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedComponentIds.forEach(id => deleteComponent(id));
        return;
      }

      // Escape - clear selection
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      // Ctrl+A - select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const page = appDefinition.pages.find(p => p.id === currentPageId);
        if (page) {
          selectComponent(page.components[0]?.id || '', false);
          page.components.slice(1).forEach(c => selectComponent(c.id, true));
        }
        return;
      }

      // Ctrl+C - copy (just select for now)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Copy functionality - store in clipboard
        return;
      }

      // Ctrl+V - paste (would need clipboard)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        return;
      }

      // Ctrl+D - duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedComponentIds.length > 0) {
          const originalId = selectedComponentIds[selectedComponentIds.length - 1];
          duplicateComponent(originalId);
        }
        return;
      }

      // Arrow keys - move selected components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? GRID_SIZE : 1;

        selectedComponentIds.forEach(id => {
          const comp = components.find(c => c.id === id);
          if (!comp) return;

          let newX = comp.style.x;
          let newY = comp.style.y;

          switch (e.key) {
            case 'ArrowUp': newY -= step; break;
            case 'ArrowDown': newY += step; break;
            case 'ArrowLeft': newX -= step; break;
            case 'ArrowRight': newX += step; break;
          }

          // Keep within canvas bounds
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);

          moveComponent(id, newX, newY);
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, selectedComponentIds, deleteComponent, clearSelection, appDefinition, currentPageId, selectComponent, duplicateComponent, components, moveComponent]);

  // Handle mouse down on canvas background
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse button OR space + left click for panning
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Left click on canvas background - start selection box or clear selection
    if (e.target === canvasRef.current || e.target === contentRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;

        // Start selection box
        setIsSelecting(true);
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
        clearSelection();
      }
    }
  }, [clearSelection, panOffset, zoom, isSpacePressed]);

  // Handle mouse move
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    // Panning
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Selection box
    if (isSelecting && selectionBox) {
      setSelectionBox({ ...selectionBox, endX: x, endY: y });
      return;
    }

    // Component dragging
    if (dragState.isDragging && dragState.componentId) {
      const deltaX = x - dragState.startX;
      const deltaY = y - dragState.startY;

      const comp = components.find(c => c.id === dragState.componentId);
      if (comp) {
        let newX = dragState.startComponentX + deltaX;
        let newY = dragState.startComponentY + deltaY;

        // Get snap position including alignment guides
        const snapPos = getSnapPosition(newX, newY, comp.style.width, comp.style.height, dragState.componentId);

        // Update alignment guides
        const guides = calculateAlignmentGuides(comp, snapPos.x, snapPos.y, comp.style.width, comp.style.height);
        setAlignmentGuides(guides);

        // Move all selected components
        if (selectedComponentIds.includes(dragState.componentId)) {
          const selectedComps = components.filter(c => selectedComponentIds.includes(c.id));
          const mainComp = selectedComps.find(c => c.id === dragState.componentId);
          if (mainComp) {
            const mainDeltaX = snapPos.x - mainComp.style.x;
            const mainDeltaY = snapPos.y - mainComp.style.y;

            selectedComps.forEach(c => {
              if (c.id !== dragState.componentId) {
                const newPos = getSnapPosition(c.style.x + mainDeltaX, c.style.y + mainDeltaY, c.style.width, c.style.height, c.id);
                moveComponent(c.id, newPos.x, newPos.y);
              }
            });
          }
        }

        moveComponent(dragState.componentId, snapPos.x, snapPos.y);
      }
      return;
    }

    // Resizing
    if (resizeState.isResizing && resizeState.componentId) {
      const deltaX = x - resizeState.startX;
      const deltaY = y - resizeState.startY;

      const comp = components.find(c => c.id === resizeState.componentId);
      if (!comp) return;

      let newWidth = resizeState.startWidth;
      let newHeight = resizeState.startHeight;
      let newX = resizeState.startCompX;
      let newY = resizeState.startCompY;

      const handle = resizeState.handle;

      // Handle resize based on handle type
      if (handle?.includes('e')) {
        newWidth = Math.max(MIN_SIZE, resizeState.startWidth + deltaX);
      }
      if (handle?.includes('w')) {
        const widthChange = Math.min(deltaX, resizeState.startWidth - MIN_SIZE);
        newWidth = resizeState.startWidth - widthChange;
        newX = resizeState.startCompX + widthChange;
      }
      if (handle?.includes('s')) {
        newHeight = Math.max(MIN_SIZE, resizeState.startHeight + deltaY);
      }
      if (handle?.includes('n')) {
        const heightChange = Math.min(deltaY, resizeState.startHeight - MIN_SIZE);
        newHeight = resizeState.startHeight - heightChange;
        newY = resizeState.startCompY + heightChange;
      }

      // Snap to grid
      newWidth = snapToGrid(newWidth);
      newHeight = snapToGrid(newHeight);
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);

      // Update both position and size
      updateComponentStyle(resizeState.componentId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isPanning, panStart, isSelecting, selectionBox, dragState, resizeState, components, selectedComponentIds, panOffset, zoom, moveComponent, getSnapPosition, calculateAlignmentGuides, setPanOffset, updateComponentStyle, snapToGrid]);

  // Handle mouse up
  const handleCanvasMouseUp = useCallback(() => {
    // Selection box - select components within box
    if (isSelecting && selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      // If box is very small, treat as click (clear selection)
      if (maxX - minX < 5 && maxY - minY < 5) {
        clearSelection();
      } else {
        // Select all components that intersect with the selection box
        const selectedIds: string[] = [];
        components.forEach(comp => {
          const compRight = comp.style.x + comp.style.width;
          const compBottom = comp.style.y + comp.style.height;

          // Check if component intersects with selection box
          if (comp.style.x < maxX && compRight > minX && comp.style.y < maxY && compBottom > minY) {
            selectedIds.push(comp.id);
          }
        });

        if (selectedIds.length > 0) {
          selectComponent(selectedIds[0], false);
          selectedIds.slice(1).forEach(id => selectComponent(id, true));
        }
      }
    }

    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
    setDragState({ isDragging: false, componentId: null, startX: 0, startY: 0, startComponentX: 0, startComponentY: 0 });
    setResizeState({ isResizing: false, componentId: null, handle: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startCompX: 0, startCompY: 0 });
    setAlignmentGuides([]);
  }, [isSelecting, selectionBox, components, selectComponent, clearSelection]);

  // Handle component mouse down - start dragging
  const handleComponentMouseDown = useCallback((e: React.MouseEvent, compId: string) => {
    e.stopPropagation();

    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    // Handle resize
    const handle = (e.target as HTMLElement).dataset.handle;
    if (handle) {
      pushState(JSON.parse(JSON.stringify(appDefinition)));
      setResizeState({
        isResizing: true,
        componentId: compId,
        handle,
        startX: (e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0) - panOffset.x) / zoom,
        startY: (e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0) - panOffset.y) / zoom,
        startWidth: comp.style.width,
        startHeight: comp.style.height,
        startCompX: comp.style.x,
        startCompY: comp.style.y,
      });
      return;
    }

    // Save history before drag
    pushState(JSON.parse(JSON.stringify(appDefinition)));

    // Start dragging
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      setDragState({
        isDragging: true,
        componentId: compId,
        startX: x,
        startY: y,
        startComponentX: comp.style.x,
        startComponentY: comp.style.y,
      });
    }

    // Select component (with shift for multi-select)
    if (e.shiftKey) {
      selectComponent(compId, true);
    } else if (!selectedComponentIds.includes(compId)) {
      selectComponent(compId, false);
    }
  }, [components, selectedComponentIds, selectComponent, appDefinition, panOffset, zoom, pushState]);

  // Handle component click
  const handleComponentClick = useCallback((e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();

    if (e.shiftKey) {
      selectComponent(componentId, true);
    } else if (!selectedComponentIds.includes(componentId)) {
      selectComponent(componentId, false);
    }
  }, [selectComponent, selectedComponentIds]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedComponentIds.includes(componentId)) {
      selectComponent(componentId, false);
    }

    setContextMenu({ x: e.clientX, y: e.clientY, componentId });
  }, [selectComponent, selectedComponentIds]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = () => closeContextMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    // Delay to prevent immediate close on right-click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, closeContextMenu]);

  // Context menu actions
  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu) return;

    const { componentId } = contextMenu;

    switch (action) {
      case 'copy':
        // Store in clipboard - TODO: implement copy
        break;
      case 'paste':
        // TODO: implement paste
        break;
      case 'delete':
        deleteComponent(componentId);
        break;
      case 'bringToFront':
        bringToFront(componentId);
        break;
      case 'sendToBack':
        sendToBack(componentId);
        break;
      case 'bringForward':
        bringForward(componentId);
        break;
      case 'sendBackward':
        sendBackward(componentId);
        break;
    }

    closeContextMenu();
  }, [contextMenu, deleteComponent, bringToFront, sendToBack, bringForward, sendBackward, closeContextMenu]);

  // Handle drop from component panel
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType') as string;
    if (componentType) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;

        // Snap to grid
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        // Save to history
        pushState(JSON.parse(JSON.stringify(appDefinition)));

        const newComponent = addComponent(componentType as ComponentType);
        if (newComponent) {
          // Center on drop position
          moveComponent(newComponent.id, snappedX - newComponent.style.width / 2, snappedY - newComponent.style.height / 2);
        }
      }
    }
  }, [addComponent, appDefinition, moveComponent, panOffset, zoom, pushState, snapToGrid]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Render grid background
  const renderGrid = () => {
    const gridSize = GRID_SIZE * zoom;
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle, #d9d9d9 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${panOffset.x % gridSize}px ${panOffset.y % gridSize}px`,
          pointerEvents: 'none',
        }}
      />
    );
  };

  // Render alignment guides
  const renderAlignmentGuides = () => {
    if (alignmentGuides.length === 0) return null;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {alignmentGuides.map((guide, idx) => (
          <line
            key={idx}
            x1={guide.type === 'vertical' ? guide.position * zoom + panOffset.x : 0}
            y1={guide.type === 'horizontal' ? guide.position * zoom + panOffset.y : 0}
            x2={guide.type === 'vertical' ? guide.position * zoom + panOffset.x : 3000 * zoom}
            y2={guide.type === 'horizontal' ? guide.position * zoom + panOffset.y : 3000 * zoom}
            stroke="#1677ff"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
        ))}
      </svg>
    );
  };

  // Render resize handles
  const renderResizeHandles = (width: number, height: number) => {
    const handles = [
      { pos: 'nw', style: { top: -4, left: -4, cursor: 'nwse-resize' } },
      { pos: 'n', style: { top: -4, left: width / 2 - 4, cursor: 'ns-resize' } },
      { pos: 'ne', style: { top: -4, right: -4, cursor: 'nesw-resize' } },
      { pos: 'e', style: { top: height / 2 - 4, right: -4, cursor: 'ew-resize' } },
      { pos: 'se', style: { bottom: -4, right: -4, cursor: 'nwse-resize' } },
      { pos: 's', style: { bottom: -4, left: width / 2 - 4, cursor: 'ns-resize' } },
      { pos: 'sw', style: { bottom: -4, left: -4, cursor: 'nesw-resize' } },
      { pos: 'w', style: { top: height / 2 - 4, left: -4, cursor: 'ew-resize' } },
    ];

    return handles.map(h => (
      <div
        key={h.pos}
        data-handle={h.pos}
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          background: '#fff',
          border: '1px solid #1677ff',
          borderRadius: 2,
          ...h.style,
        }}
      />
    ));
  };

  // Render selection box
  const renderSelectionBox = () => {
    if (!selectionBox) return null;

    const x = Math.min(selectionBox.startX, selectionBox.endX);
    const y = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);

    return (
      <div
        style={{
          position: 'absolute',
          left: x * zoom + panOffset.x,
          top: y * zoom + panOffset.y,
          width: width * zoom,
          height: height * zoom,
          border: '1px dashed #1677ff',
          background: 'rgba(22, 119, 255, 0.1)',
          pointerEvents: 'none',
        }}
      />
    );
  };

  // Render components
  const renderComponents = () => {
    return components.map((comp) => {
      const isSelected = selectedComponentIds.includes(comp.id);
      const { x, y, width, height, zIndex = 0 } = comp.style;

      // Get component definition from registry
      const compDef = registry.get(comp.type);
      const ComponentRender = compDef?.render;

      return (
        <div
          key={comp.id}
          onClick={(e) => handleComponentClick(e, comp.id)}
          onMouseDown={(e) => handleComponentMouseDown(e, comp.id)}
          onContextMenu={(e) => handleContextMenu(e, comp.id)}
          style={{
            position: 'absolute',
            left: x * zoom + panOffset.x,
            top: y * zoom + panOffset.y,
            width: width * zoom,
            height: height * zoom,
            // Only show border when selected, otherwise transparent
            border: isSelected ? '2px dashed #1677ff' : 'none',
            borderRadius: isSelected ? 4 : 0,
            // Background is transparent by default, only apply when user sets it
            backgroundColor: 'transparent',
            cursor: dragState.componentId === comp.id ? 'grabbing' : 'move',
            zIndex: zIndex,
            transition: 'border-color 0.1s',
          }}
        >
          {/* Component label */}
          <div
            style={{
              position: 'absolute',
              top: -24,
              left: 0,
              background: isSelected ? '#1677ff' : '#595959',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          >
            {comp.name}
          </div>

          {/* Component content - use registry render */}
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {ComponentRender ? (
              <ComponentRender
                props={comp.props}
                style={{ width: '100%', height: '100%' }}
                mode={mode}
                componentId={comp.id}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                {comp.type}
              </div>
            )}
          </div>

          {/* Edit mode overlay - block interactions */}
          {mode === 'edit' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'transparent',
                cursor: 'move',
              }}
            />
          )}

          {/* Resize handles */}
          {isSelected && renderResizeHandles(width, height)}
        </div>
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        flex: 1,
        background: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : isSpacePressed ? 'grab' : 'default',
      }}
    >
      {renderGrid()}
        {renderAlignmentGuides()}
        {renderSelectionBox()}

        <div ref={contentRef} style={{ position: 'absolute', transformOrigin: '0 0' }}>
          {renderComponents()}
        </div>

        {/* Zoom indicator */}
        <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => {
              const levels = [0.5, 0.75, 1, 1.5, 2];
              const currentIdx = levels.findIndex(l => Math.abs(l - zoom) < 0.1);
              const nextIdx = (currentIdx + 1) % levels.length;
              setZoom(levels[nextIdx]);
            }}
          >
            {Math.round(zoom * 100)}%
          </div>

        {/* Hint text when dragging */}
        {isDraggingFromPanel && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(22, 119, 255, 0.9)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              pointerEvents: 'none',
            }}
          >
            拖放到此处添加组件
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 9999,
            }}
          >
            <Menu
              mode="vertical"
              onClick={({ key }) => handleContextMenuAction(key)}
              items={[
                { key: 'copy', icon: <CopyOutlined />, label: '复制 (Ctrl+C)' },
                { key: 'paste', icon: <ScissorOutlined />, label: '粘贴 (Ctrl+V)' },
                { type: 'divider' },
                { key: 'bringToFront', icon: <BorderOutlined />, label: '置于顶层' },
                { key: 'sendToBack', icon: <ColumnHeightOutlined />, label: '置于底层' },
                { key: 'bringForward', icon: <ArrowUpOutlined />, label: '上移一层' },
                { key: 'sendBackward', icon: <ArrowDownOutlined />, label: '下移一层' },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: '删除 (Delete)', danger: true },
              ]}
            />
          </div>
        )}
      </div>
  );
};

export default Canvas;
