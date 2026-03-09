import React, { useState } from 'react';
import { Input, Button, Typography, Empty, Tooltip, Dropdown, Modal, message, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  BlockOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  CodeOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  HomeOutlined,
  HolderOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { registry, ComponentCategory } from '../../registry';
import { useQueryStore } from '../../stores/queryStore';
import type { ComponentNode } from '@novabuilder/shared';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

type LeftPanelView = 'components' | 'pages' | 'tree' | 'queries' | null;

// Category metadata with icons
const categoryMeta: Record<ComponentCategory, { label: string; icon: React.ReactNode }> = {
  data: { label: '数据展示', icon: <DatabaseOutlined /> },
  form: { label: '表单输入', icon: <BlockOutlined /> },
  layout: { label: '布局容器', icon: <AppstoreOutlined /> },
  action: { label: '操作反馈', icon: <BlockOutlined /> },
  media: { label: '媒体展示', icon: <BlockOutlined /> },
  navigation: { label: '导航', icon: <BlockOutlined /> },
};

export interface LeftPanelProps {
  onQuerySelect?: (queryId: string) => void;
  onNewQuery?: () => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ onQuerySelect, onNewQuery }) => {
  const [activeView, setActiveView] = useState<LeftPanelView>(null);
  const [searchText, setSearchText] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build component categories from registry
  const componentCategories = React.useMemo(() => {
    const categories: ComponentCategory[] = ['data', 'form', 'layout', 'action', 'media', 'navigation'];

    return categories.map((category) => {
      const components = registry.getByCategory(category);
      return {
        category,
        label: categoryMeta[category].label,
        icon: categoryMeta[category].icon,
        components: components.map((comp) => ({
          type: comp.type,
          label: comp.name,
        })),
      };
    }).filter((cat) => cat.components.length > 0);
  }, []);

  const {
    appDefinition,
    currentPageId,
    setCurrentPage,
    addPage,
    updatePage,
    deletePage,
    reorderPages,
    setHomePage,
    selectComponent,
    selectedComponentIds,
  } = useEditorStore();

  // Get current page from appDefinition
  const currentPage = appDefinition.pages.find(p => p.id === currentPageId);

  // Query store
  const { queries, activeQueryId, setActiveQuery } = useQueryStore();

  // Handle query click
  const handleQueryClick = (queryId: string) => {
    setActiveQuery(queryId);
    onQuerySelect?.(queryId);
  };

  // Handle new query
  const handleNewQuery = () => {
    onNewQuery?.();
  };

  const handleToggle = (view: LeftPanelView) => {
    if (activeView === view) {
      setActiveView(null); // Collapse if same view clicked
    } else {
      setActiveView(view);
    }
  };

  const handleAddPage = () => {
    if (appDefinition.pages.length >= 10) return;
    const pageName = `页面${appDefinition.pages.length + 1}`;
    addPage(pageName);
  };

  // Double-click to edit page name
  const handlePageDoubleClick = (pageId: string, pageName: string) => {
    setEditingPageId(pageId);
    setEditingPageName(pageName);
  };

  // Save page name
  const handlePageNameSave = (pageId: string) => {
    if (editingPageName.trim()) {
      updatePage(pageId, { name: editingPageName.trim() });
    }
    setEditingPageId(null);
  };

  // Delete page
  const handleDeletePage = (pageId: string) => {
    if (appDefinition.pages.length <= 1) {
      message.warning('至少保留一个页面');
      return;
    }
    Modal.confirm({
      title: '删除页面',
      content: '确定要删除这个页面吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: () => {
        deletePage(pageId);
        message.success('删除成功');
      },
    });
  };

  // Copy page
  const handleCopyPage = (pageId: string) => {
    const page = appDefinition.pages.find(p => p.id === pageId);
    if (page) {
      const newName = `${page.name} (copy)`;
      addPage(newName);
      message.success('页面复制成功');
    }
  };

  // Set as home page
  const handleSetHomePage = (pageId: string) => {
    setHomePage(pageId);
    message.success('已设为主页');
  };

  // Handle drag end for page reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = appDefinition.pages.findIndex(p => p.id === active.id);
      const newIndex = appDefinition.pages.findIndex(p => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderPages(oldIndex, newIndex);
      }
    }
  };

  // Render components panel content
  const renderComponentsContent = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 0' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索组件..."
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {componentCategories.map((cat) => {
          const filteredComponents = cat.components.filter((c) =>
            searchText ? c.label.toLowerCase().includes(searchText.toLowerCase()) : true
          );
          if (searchText && filteredComponents.length === 0) return null;

          return (
            <div key={cat.category} style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                {cat.icon} {cat.label}
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {filteredComponents.map((comp) => (
                  <div
                    key={comp.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('componentType', comp.type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    style={{
                      width: 48,
                      height: 48,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                      borderRadius: 4,
                      cursor: 'grab',
                      fontSize: 10,
                      border: '1px solid #e8e8e8',
                      transition: 'all 0.2s',
                    }}
                  >
                    <BlockOutlined style={{ fontSize: 16, marginBottom: 2 }} />
                    <span>{comp.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Sortable page item component
  const SortablePageItem: React.FC<{ page: any }> = ({ page }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: page.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const menuItems = {
      items: [
        { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: () => handlePageDoubleClick(page.id, page.name) },
        { key: 'copy', icon: <CopyOutlined />, label: '复制', onClick: () => handleCopyPage(page.id) },
        { key: 'setHome', icon: <HomeOutlined />, label: '设为主页', onClick: () => handleSetHomePage(page.id) },
        { type: 'divider' as const },
        { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: () => handleDeletePage(page.id) },
      ],
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
      >
        <Dropdown menu={menuItems} trigger={['contextMenu']}>
          <div
            onClick={() => setCurrentPage(page.id)}
            onDoubleClick={() => handlePageDoubleClick(page.id, page.name)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              background: currentPageId === page.id ? '#e6f7ff' : 'transparent',
              borderLeft: currentPageId === page.id ? '3px solid #1677ff' : '3px solid transparent',
              borderBottom: '1px solid #f5f5f5',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
          >
            <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#999' }}>
              <HolderOutlined />
            </span>
            <FileOutlined />
            {editingPageId === page.id ? (
              <Input
                size="small"
                value={editingPageName}
                onChange={(e) => setEditingPageName(e.target.value)}
                onBlur={() => handlePageNameSave(page.id)}
                onPressEnter={() => handlePageNameSave(page.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              />
            ) : (
              <span style={{ flex: 1, fontSize: 12 }}>{page.name}</span>
            )}
            {page.isHome && (
              <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f7ff', padding: '1px 4px', borderRadius: 2 }}>
                首页
              </span>
            )}
          </div>
        </Dropdown>
      </div>
    );
  };

  // Render pages panel content
  const renderPagesContent = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '8px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text strong style={{ fontSize: 12 }}>页面列表</Text>
        <Tooltip title={appDefinition.pages.length >= 10 ? '最多 10 个页面' : ''}>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddPage}
            disabled={appDefinition.pages.length >= 10}
          >
            新建
          </Button>
        </Tooltip>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={appDefinition.pages.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {appDefinition.pages.map((page) => (
              <SortablePageItem key={page.id} page={page} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );

  // Render tree panel content
  const renderTreeContent = () => {
    const components = currentPage?.components || [];

    // Build tree data from components
    const buildTreeData = (comps: ComponentNode[], parentId?: string): DataNode[] => {
      return comps
        .filter((c: ComponentNode) => c.props?.parentId === parentId)
        .map((comp: ComponentNode) => ({
          key: comp.id,
          title: (
            <span style={{ fontSize: 12 }}>
              <BlockOutlined style={{ marginRight: 4 }} />
              {comp.name}
            </span>
          ),
          children: buildTreeData(components, comp.id),
        }));
    };

    // Get root components (no parent)
    const rootComponents = components.filter((c: ComponentNode) => !c.props?.parentId);
    const treeData: DataNode[] = rootComponents.map((comp: ComponentNode) => ({
      key: comp.id,
      title: (
        <span style={{ fontSize: 12 }}>
          <BlockOutlined style={{ marginRight: 4 }} />
          {comp.name}
        </span>
      ),
      children: buildTreeData(components, comp.id),
    }));

    // Handle tree selection
    const handleSelect = (selectedKeys: React.Key[]) => {
      if (selectedKeys.length > 0) {
        selectComponent(selectedKeys[0] as string);
      }
    };

    return (
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 0' }}>
        {components.length === 0 ? (
          <Empty description="暂无组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tree
            showLine
            defaultExpandAll
            selectedKeys={selectedComponentIds}
            onSelect={handleSelect}
            treeData={treeData}
            style={{ fontSize: 12 }}
          />
        )}
      </div>
    );
  };

  // Render queries panel content
  const renderQueriesContent = () => {
    // Get type icon
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'sql': return <DatabaseOutlined />;
        case 'javascript': return <CodeOutlined />;
        case 'visual': return <FileOutlined />;
        case 'rest': return <ApiOutlined />;
        default: return <CodeOutlined />;
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '8px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Text strong style={{ fontSize: 12 }}>查询列表</Text>
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleNewQuery}>
            新建
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {queries.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 11, display: 'block', padding: '0 12px' }}>
              暂无查询，请点击"新建"创建
            </Text>
          ) : (
            queries.map((query) => (
              <div
                key={query.id}
                onClick={() => handleQueryClick(query.id)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: activeQueryId === query.id ? '#e6f7ff' : 'transparent',
                  borderLeft: activeQueryId === query.id ? '3px solid #1677ff' : '3px solid transparent',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                }}
              >
                {getTypeIcon(query.type)}
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {query.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'components':
        return renderComponentsContent();
      case 'pages':
        return renderPagesContent();
      case 'tree':
        return renderTreeContent();
      case 'queries':
        return renderQueriesContent();
      default:
        return null;
    }
  };

  const iconButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    background: isActive ? '#e6f7ff' : 'transparent',
    color: isActive ? '#1677ff' : '#595959',
    borderLeft: isActive ? '3px solid #1677ff' : '3px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Icon Navigation Bar - 48px width */}
      <div
        style={{
          width: 48,
          background: '#fff',
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: activeView ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <Tooltip title="组件" placement="right">
          <div
            style={iconButtonStyle(activeView === 'components')}
            onClick={() => handleToggle('components')}
          >
            <AppstoreOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
        <Tooltip title="页面" placement="right">
          <div
            style={iconButtonStyle(activeView === 'pages')}
            onClick={() => handleToggle('pages')}
          >
            <FileOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
        <Tooltip title="组件树" placement="right">
          <div
            style={iconButtonStyle(activeView === 'tree')}
            onClick={() => handleToggle('tree')}
          >
            <ApartmentOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
        <Tooltip title="查询" placement="right">
          <div
            style={iconButtonStyle(activeView === 'queries')}
            onClick={() => handleToggle('queries')}
          >
            <CodeOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
      </div>

      {/* Expandable Content Panel - 240px width */}
      <div
        style={{
          width: activeView ? 240 : 0,
          background: '#fff',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 240, height: '100%', overflow: 'auto', padding: '0 12px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
