import { useState } from 'react'
import * as S from './styles'
import { LuPanelRightClose, LuPanelRightOpen } from 'react-icons/lu'
import { useViews } from '@/contexts/ViewsProvider'
import { formatMenusForAntDesign } from '@/data/menus'
import { Button } from 'antd'
import { useAuth } from '@/contexts/AuthProvider'
import { ActiveCity, UserMenu } from '@/components'
import { Navigate } from 'react-router-dom'

const DashboardV1 = () => {
  const { activeMenu, setActiveMenu, loadingMenus, menus } = useViews()
  const { user } = useAuth()

  const [sideMenuOpened, setSideMenuOpened] = useState(true)

  if (!user) return null
  if (loadingMenus) return <div>Carregando dashboard...</div>

  const toggleSideMenu = () => setSideMenuOpened(!sideMenuOpened)
  const menuItems = formatMenusForAntDesign(user)

  return (
    <S.DashboardScreen>
      <S.DashboardSideMenu opened={sideMenuOpened ? 1 : 0}>
        <S.DashboardSideMenuHeader>
          <S.DashboardLogo>
            <S.DashboardLogoImg
              opened={sideMenuOpened ? 1 : 0}
              src={
                sideMenuOpened
                  ? '/logos/logo_mandato_full.png'
                  : '/logos/logo_mandato_minified.png'
              }
              alt="Logo Mandato Digital"
            />
          </S.DashboardLogo>
        </S.DashboardSideMenuHeader>
        <S.DashboardSideMenuWrapper>
          <ActiveCity cityId={user?.cityId} menuClosed={!sideMenuOpened} />
          <S.DashboardMenu
            mode="inline"
            selectedKeys={activeMenu ? [activeMenu.menuId] : []}
            items={menuItems}
            onClick={({ key }) => setActiveMenu(key)}
            opened={sideMenuOpened ? 1 : 0}
          />
        </S.DashboardSideMenuWrapper>
      </S.DashboardSideMenu>
      <S.DashboardMain opened={sideMenuOpened ? 1 : 0}>
        <S.DashboardMainHeader>
          <Button
            icon={sideMenuOpened ? <LuPanelRightOpen /> : <LuPanelRightClose />}
            onClick={toggleSideMenu}
          />
          <S.DashboardActiveViewLabel>
            <h2>{activeMenu?.menuName}</h2>
            <p>{activeMenu?.menuLegend}</p>
          </S.DashboardActiveViewLabel>
          <UserMenu />
        </S.DashboardMainHeader>
        <S.DashboardMainViewsWrapper>
          <S.DashboardMainView>
            {activeMenu ? (
              activeMenu.menuView
            ) : (
              <Navigate to={`/dashboard/${menus[0]?.menuId}`} />
            )}
          </S.DashboardMainView>
        </S.DashboardMainViewsWrapper>
      </S.DashboardMain>
    </S.DashboardScreen>
  )
}

export default DashboardV1
