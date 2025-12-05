import { useState } from 'react'

export type SidebarTool =
  | 'draft'
  | 'ai-chat'
  | 'discussion'
  | 'files'
  | 'patent-analysis'
  | 'video-chat'
  | 'prior-art'
  | 'claims'
  | 'templates'

interface SidebarItem {
  id: SidebarTool
  icon: string
  label: string
  description: string
}

interface SidebarProps {
  activeTool: SidebarTool
  onToolChange: (tool: SidebarTool) => void
  availableTools?: SidebarTool[]
}

const ALL_TOOLS: SidebarItem[] = [
  {
    id: 'draft',
    icon: '📝',
    label: 'Draft',
    description: 'Patent draft editor',
  },
  {
    id: 'ai-chat',
    icon: '💬',
    label: 'AI Assistant',
    description: 'Drafting assistant chat',
  },
  {
    id: 'discussion',
    icon: '👥',
    label: 'Discussion',
    description: 'Chat with inventor',
  },
  {
    id: 'files',
    icon: '📁',
    label: 'Files',
    description: 'Shared files & documents',
  },
  {
    id: 'patent-analysis',
    icon: '🔬',
    label: 'Patent Analysis',
    description: 'AI patent valuation',
  },
  {
    id: 'video-chat',
    icon: '📹',
    label: 'Video Meeting',
    description: 'AI-powered video chat',
  },
  {
    id: 'prior-art',
    icon: '🔍',
    label: 'Prior Art',
    description: 'Patent search & research',
  },
  {
    id: 'claims',
    icon: '📊',
    label: 'Claims',
    description: 'Claims structure tree',
  },
  {
    id: 'templates',
    icon: '📋',
    label: 'Templates',
    description: 'Text templates library',
  },
]

export default function Sidebar({ activeTool, onToolChange, availableTools }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Filter tools based on availableTools prop
  const tools = availableTools
    ? ALL_TOOLS.filter((tool) => availableTools.includes(tool.id))
    : ALL_TOOLS

  return (
    <div
      className={`bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        {!isCollapsed && <h3 className="font-semibold text-neutral-900">Tools</h3>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 text-neutral-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Tool List */}
      <nav className="flex-1 overflow-y-auto py-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
              activeTool === tool.id
                ? 'bg-navy-50 border-r-2 border-navy-700 text-navy-700'
                : 'hover:bg-neutral-50 text-neutral-700'
            }`}
            title={isCollapsed ? tool.label : tool.description}
          >
            <span className="text-2xl flex-shrink-0">{tool.icon}</span>
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{tool.label}</div>
                <div className="text-xs text-neutral-500">{tool.description}</div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer - Collapse indicator */}
      {isCollapsed && (
        <div className="p-2 border-t border-neutral-200 text-center">
          <div className="text-xs text-neutral-400">Tools</div>
        </div>
      )}
    </div>
  )
}
