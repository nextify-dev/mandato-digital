// src/components/UserMenu/index.tsx

import { Dropdown, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { USER_MENU } from '@/data/menus'

interface UserMenuProps {
  logout: () => void
}

const UserMenu = ({ logout }: UserMenuProps) => {
  const items = USER_MENU.map((menu) => ({
    key: menu.menuId,
    label: menu.menuName,
    icon: menu.menuIcon,
    onClick: menu.menuId === 'sair' ? logout : undefined
  }))

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
    </Dropdown>
  )
}

export default UserMenu
