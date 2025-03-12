import styled from 'styled-components'
import { theme } from 'antd'
import { Screen } from '@/utils/styles/commons'
import { StyledMenu } from '@/utils/styles/antd'
import { color, backgroundColor } from '@/utils/styles/colors'
import { Globals } from '@/utils/styles/globals'
import { font } from '@/utils/styles/fonts'

const { useToken } = theme

export const DashboardScreen = styled(Screen)`
  display: flex;
  flex-direction: row;
`

export const DashboardSideMenu = styled.div<{ opened: number }>`
  display: flex;
  flex-direction: column;
  width: ${({ opened }) =>
    opened
      ? Globals.layout.sidebar.width.expanded
      : Globals.layout.sidebar.width.collapsed};
  height: 100vh;
  transition: 0.3s;
  border-right: 1px solid ${color('colorBorderSecondary')};
`

export const DashboardSideMenuHeader = styled.div`
  position: relative;
  height: ${Globals.layout.header.height};
  border-bottom: 1px solid ${color('colorBorderSecondary')};
`

export const DashboardLogo = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  ${backgroundColor('colorBgBase')}
`

export const DashboardLogoImg = styled.img<{ opened: number }>`
  height: ${({ opened }) => (opened ? '70%' : '40%')};
  transition: 0.3s;
`

export const DashboardSideMenuWrapper = styled.div`
  display: flex;
  width: 100%;
  height: calc(100% - ${Globals.layout.header.height});
  padding-left: 10px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
`

export const DashboardMenu = styled(StyledMenu)`
  overflow: auto;
  padding-bottom: 15px;
`

export const DashboardMain = styled.div<{ opened: number }>`
  display: flex;
  flex-direction: column;
  width: ${({ opened }) =>
    opened
      ? `calc(100% - ${Globals.layout.sidebar.width.expanded})`
      : `calc(100% - ${Globals.layout.sidebar.width.collapsed})`};
  height: 100vh;
`

export const DashboardMainHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: ${Globals.layout.content.headerHeight};
  padding: 0 ${Globals.layout.padding};
  border-bottom: 1px solid ${color('colorBorderSecondary')};
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
`

export const DashboardActiveViewLabel = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 3px;
  margin: 0 auto 0 12px;

  h2 {
    ${font('subtitle')}
    ${color('colorTextHeading')}
  }

  p {
    ${font('caption')}
    ${color('colorTextDescription')}
  }
`

export const DashboardMainViewsWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: calc(100% - ${Globals.layout.content.headerHeight});
  overflow: auto;
  padding: ${Globals.layout.padding};
  ${backgroundColor('colorBgBase')}
`

export const DashboardMainView = styled.div`
  display: flex;
  width: 100%;
  max-width: ${Globals.layout.content.maxWidth};
  height: fit-content;
`
