import { Home, Leaf, Wallet, HeartPulse, Moon, Heart, BarChart3, LineChart, FolderOpen } from 'lucide-react'

const iconSize = 20

export const SidebarIcons = {
  home: <Home size={iconSize} strokeWidth={2} />,
  analytics: <LineChart size={iconSize} strokeWidth={2} />,
  content: <FolderOpen size={iconSize} strokeWidth={2} />,
  harmony: <Leaf size={iconSize} strokeWidth={2} />,
  finance: <Wallet size={iconSize} strokeWidth={2} />,
  health: <HeartPulse size={iconSize} strokeWidth={2} />,
  sleep: <Moon size={iconSize} strokeWidth={2} />,
  love: <Heart size={iconSize} strokeWidth={2} />,
  statistics: <BarChart3 size={iconSize} strokeWidth={2} />,
}
