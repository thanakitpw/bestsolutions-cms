import type { FC, SVGProps } from 'react'
import {
  LayoutGrid,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  BarChart2,
} from 'lucide-react'

export type IconComponent = FC<SVGProps<SVGSVGElement> & { size?: number | string }>

export type MenuItem = {
  label: string
  href: string
  icon: IconComponent
  show: boolean
}

export type MenuSection = {
  section: string
  items: MenuItem[]
}

export function buildMenuSections(
  enabledFeatures: string[],
  isSuperAdmin: boolean
): MenuSection[] {
  return [
    {
      section: 'CONTENT',
      items: [
        {
          label: 'Projects',
          href: '/projects',
          icon: LayoutGrid,
          show: isSuperAdmin || enabledFeatures.includes('projects'),
        },
        {
          label: 'Blog',
          href: '/blog',
          icon: FileText,
          show: isSuperAdmin || enabledFeatures.includes('blog'),
        },
      ],
    },
    {
      section: 'COMMUNICATION',
      items: [
        {
          label: 'Messages',
          href: '/messages',
          icon: MessageSquare,
          show: isSuperAdmin || enabledFeatures.includes('messages'),
        },
      ],
    },
    {
      section: 'ASSETS',
      items: [
        { label: 'Media', href: '/media', icon: ImageIcon, show: true },
      ],
    },
    {
      section: 'SYSTEM',
      items: [
        { label: 'Settings', href: '/settings', icon: Settings, show: true },
        {
          label: 'Analytics',
          href: '/analytics',
          icon: BarChart2,
          show: true,
        },
      ],
    },
  ]
}
