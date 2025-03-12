// src/contexts/ViewsProvider.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App } from 'antd'
import { DASHBOARD_MENUS, IMenu } from '@/data/menus'
import { useAuth } from '@/contexts/AuthProvider'
import { UserType } from '@/@types/user'

interface ViewsContextData {
  activeMenu: IMenu | null
  setActiveMenu: (menuId: string) => void
  menus: IMenu[]
  loadingMenus: boolean
}

const ViewsContext = createContext<ViewsContextData>({} as ViewsContextData)

export const ViewsProvider = ({ children }: { children: ReactNode }) => {
  const { message } = App.useApp()
  const { menuId } = useParams<{ menuId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeMenu, setActiveMenuState] = useState<IMenu | null>(null)
  const [loading, setLoading] = useState(true)

  const userMenus = user
    ? DASHBOARD_MENUS.filter((m) => {
        const perms = m.requiredPermissions
        return Object.keys(perms).every((key) => {
          const permKey = key as keyof UserType['permissions']
          return (
            perms[permKey] === undefined ||
            user.permissions[permKey] === perms[permKey]
          )
        })
      })
    : []

  const setActiveMenu = (id: string) => {
    const menu = userMenus.find((m) => m.menuId === id)
    if (menu && !menu.menuDisabled) {
      setActiveMenuState(menu)
      navigate(`/dashboard/${id}`)
    } else {
      navigate(`/dashboard/${userMenus[0]?.menuId || 'dashboard-inicial'}`)
    }
  }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    if (!menuId) {
      navigate(`/dashboard/${userMenus[0]?.menuId || 'dashboard-inicial'}`)
    } else {
      const menu = userMenus.find((m) => m.menuId === menuId)
      if (menu && !menu.menuDisabled) {
        setActiveMenuState(menu)
      } else {
        navigate(`/dashboard/${userMenus[0]?.menuId || 'dashboard-inicial'}`)
      }
    }
    setLoading(false)
  }, [menuId, navigate, user])

  const contextValue: ViewsContextData = {
    activeMenu,
    setActiveMenu,
    menus: userMenus.filter((m) => !m.menuHidden),
    loadingMenus: loading
  }

  return (
    <ViewsContext.Provider value={contextValue}>
      {children}
    </ViewsContext.Provider>
  )
}

export const useViews = () => {
  const context = useContext(ViewsContext)
  if (!context) throw new Error('useViews must be used within a ViewsProvider')
  return context
}
