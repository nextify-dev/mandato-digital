// src/components/UserMenu/index.tsx

import { useNavigate } from 'react-router-dom'

import * as S from './styles'

import { Dropdown, Avatar, theme } from 'antd'

import { MenuProps } from 'antd/lib'

import { USER_MENU } from '@/data/menus'
import { formatUsername } from '@/utils/functions/formatUsername'
import { useAuth } from '@/contexts/AuthProvider'
import { getRoleData } from '@/@types/user'

interface UserMenuProps {}

const UserMenu = ({}: UserMenuProps) => {
  const navigate = useNavigate()
  const { isAuth, user, logout } = useAuth()
  const { token } = theme.useToken()

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'user_exit') {
      logout()
      return
    }

    navigate(`/dashboard/${e.key}`)
  }

  const items = USER_MENU.map((menu) => ({
    key: menu.menuId,
    label: menu.menuName,
    icon: menu.menuIcon,
    onClick: menu.menuId === 'sair' ? logout : undefined
  }))

  return (
    <Dropdown
      menu={{ items, onClick: handleMenuClick }}
      trigger={['click']}
      placement="bottomRight"
    >
      <S.UserMenu>
        <S.UserMenuInfos>
          {!isAuth || !user ? (
            <S.UserMenuLoading>Carregando...</S.UserMenuLoading>
          ) : (
            <>
              <S.UserWelcome>
                Olá, <b>{user?.profile?.nomeCompleto}</b>
              </S.UserWelcome>
              <S.UserRoleTag color={getRoleData(user?.role).color}>
                {getRoleData(user?.role).label}
              </S.UserRoleTag>
            </>
          )}
        </S.UserMenuInfos>

        <Avatar
          size={34}
          style={{
            paddingTop: 2,
            fontSize: 15,
            backgroundColor: token.colorPrimary
          }}
        >
          {formatUsername(user?.profile?.nomeCompleto || '')}
        </Avatar>
      </S.UserMenu>
    </Dropdown>
  )
}

export default UserMenu
