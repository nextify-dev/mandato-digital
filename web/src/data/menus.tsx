// src/data/menus.tsx

import { ReactNode } from 'react'
import { GetProp, MenuProps } from 'antd'
import {
  LuHouse,
  LuUsers,
  LuMap,
  LuFileText,
  LuChartColumnBig,
  LuMegaphone,
  LuCalendar,
  LuMessageSquare,
  LuShield,
  LuCircleUser,
  LuLogOut,
  LuMessagesSquare,
  LuChartBar, // Para Segmentação de Eleitores
  LuSend, // Para Campanhas Informativas
  LuClipboardList, // Para Enquetes e Pesquisas
  LuTarget, // Para Painel de Metas e Resultados
  LuHistory, // Para Histórico do Eleitor
  LuCalendarClock // Para Agendamento de Publicações
} from 'react-icons/lu'

import DashboardInicialView from '@/screens/DashboardV1/views/DashboardInicial'
import GestaoUsuariosView from '@/screens/DashboardV1/views/GestaoUsuarios'
import GestaoCidadesView from '@/screens/DashboardV1/views/GestaoCidades'
import CadastroEleitoresView from '@/screens/DashboardV1/views/CadastroEleitores'
import RegistroVisitasView from '@/screens/DashboardV1/views/RegistroVisitas'
import DemandasEleitoraisView from '@/screens/DashboardV1/views/DemandasEleitorais'
import MapaEleitoralView from '@/screens/DashboardV1/views/MapaEleitoral'
import RelatoriosView from '@/screens/DashboardV1/views/Relatorios'
import TransparenciaView from '@/screens/DashboardV1/views/Transparencia'
import ComunicacaoView from '@/screens/DashboardV1/views/Comunicacao'
import PlanejamentoView from '@/screens/DashboardV1/views/Planejamento'
import MonitoramentoRedesView from '@/screens/DashboardV1/views/MonitoramentoRedes'
import MinhaContaView from '@/screens/DashboardV1/views/MinhaConta'
import SegmentacaoEleitoresView from '@/screens/DashboardV1/views/SegmentacaoEleitores'

import { UserType, Permissions } from '@/@types/user'
import { MapProvider } from '@/contexts/MapProvider'
import { TicketsProvider } from '@/contexts/TicketsProvider'

// Interface do Menu
export interface IMenu {
  menuId: string
  menuName: string
  menuLegend: string
  menuIcon: ReactNode
  menuView: ReactNode
  menuCategory: string
  requiredPermissions: Partial<Permissions>
  menuDisabled?: boolean
  menuHidden?: boolean
}

// Menus disponíveis no sistema
export const DASHBOARD_MENUS: IMenu[] = [
  // Categoria: Principal
  {
    menuId: 'dashboard-inicial',
    menuName: 'Dashboard Inicial',
    menuLegend: 'Visão geral do sistema',
    menuIcon: <LuHouse />,
    menuView: (
      <>
        <DashboardInicialView />
      </>
    ),
    menuCategory: 'Principal',
    requiredPermissions: {},
    menuDisabled: true,
    menuHidden: false
  },

  // Categoria: Gestão
  {
    menuId: 'gestao-cidades',
    menuName: 'Gestão de Cidades',
    menuLegend: 'Gerenciar cidades cadastradas',
    menuIcon: <LuMap />,
    menuView: (
      <>
        <GestaoCidadesView />
      </>
    ),
    menuCategory: 'Gestão',
    requiredPermissions: { canManageAllCities: true },
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'cadastro-eleitores',
    menuName: 'Cadastro de Eleitores',
    menuLegend: 'Gerenciar eleitores',
    menuIcon: <LuUsers />,
    menuView: (
      <>
        <CadastroEleitoresView />
      </>
    ),
    menuCategory: 'Gestão',
    requiredPermissions: { canRegisterVoters: true },
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'registro-visitas',
    menuName: 'Registro de Visitas',
    menuLegend: 'Registrar e visualizar visitas',
    menuIcon: <LuFileText />,
    menuView: (
      <>
        <RegistroVisitasView />
      </>
    ),
    menuCategory: 'Gestão',
    requiredPermissions: { canRegisterVoters: true },
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'demandas-eleitorais',
    menuName: 'Demandas Eleitorais',
    menuLegend: 'Gerenciar demandas dos eleitores',
    menuIcon: <LuFileText />,
    menuView: (
      <>
        <DemandasEleitoraisView />
      </>
    ),
    menuCategory: 'Gestão',
    requiredPermissions: { canRegisterVoters: true },
    menuDisabled: false,
    menuHidden: false
  },

  // Categoria: Análise
  {
    menuId: 'mapa-eleitoral',
    menuName: 'Mapa Eleitoral',
    menuLegend: 'Visualizar mapa eleitoral',
    menuIcon: <LuMap />,
    menuView: (
      <MapProvider>
        <MapaEleitoralView />
      </MapProvider>
    ),
    menuCategory: 'Análise',
    requiredPermissions: { canViewCityMap: true },
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'segmentacao-eleitores',
    menuName: 'Segmentação de Eleitores',
    menuLegend: 'Filtrar e visualizar dados demográficos',
    menuIcon: <LuChartBar />,
    menuView: (
      <>
        <SegmentacaoEleitoresView />
      </>
    ),
    menuCategory: 'Análise',
    requiredPermissions: { canViewReports: true },
    menuDisabled: true,
    menuHidden: false
  },
  {
    menuId: 'relatorios',
    menuName: 'Relatórios',
    menuLegend: 'Estatísticas e relatórios',
    menuIcon: <LuChartColumnBig />,
    menuView: (
      <>
        <RelatoriosView />
      </>
    ),
    menuCategory: 'Análise',
    requiredPermissions: { canViewReports: true },
    menuDisabled: true,
    menuHidden: false
  },
  {
    menuId: 'transparencia',
    menuName: 'Transparência',
    menuLegend: 'Portal de transparência',
    menuIcon: <LuShield />,
    menuView: (
      <>
        <TransparenciaView />
      </>
    ),
    menuCategory: 'Análise',
    requiredPermissions: { canViewReports: true },
    menuDisabled: true,
    menuHidden: false
  },

  // Categoria: Comunicação
  {
    menuId: 'comunicacao',
    menuName: 'Central de Relacionamento',
    menuLegend: 'Gerenciar tickets e relacionamento com eleitores',
    menuIcon: <LuMessagesSquare />,
    menuView: (
      <TicketsProvider>
        <ComunicacaoView />
      </TicketsProvider>
    ),
    menuCategory: 'Comunicação',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'campanhas-informativas',
    menuName: 'Campanhas Informativas',
    menuLegend: 'Criar e gerenciar campanhas informativas',
    menuIcon: <LuSend />,
    menuView: <div>CampanhasInformativasView (a ser implementado)</div>,
    menuCategory: 'Comunicação',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: true,
    menuHidden: false
  },
  {
    menuId: 'enquetes-pesquisas',
    menuName: 'Enquetes e Pesquisas',
    menuLegend: 'Criar e analisar enquetes',
    menuIcon: <LuClipboardList />,
    menuView: <div>EnquetesPesquisasView (a ser implementado)</div>,
    menuCategory: 'Comunicação',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: true,
    menuHidden: false
  },
  {
    menuId: 'agendamento-publicacoes',
    menuName: 'Agendamento de Publicações',
    menuLegend: 'Programar postagens e conteúdos',
    menuIcon: <LuCalendarClock />,
    menuView: <div>AgendamentoPublicacoesView (a ser implementado)</div>,
    menuCategory: 'Comunicação',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: true,
    menuHidden: false
  },
  {
    menuId: 'monitoramento-redes',
    menuName: 'Monitoramento de Redes Sociais',
    menuLegend: 'Analisar menções em redes sociais',
    menuIcon: <LuMessageSquare />,
    menuView: (
      <>
        <MonitoramentoRedesView />
      </>
    ),
    menuCategory: 'Comunicação',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: true,
    menuHidden: false
  },

  // Categoria: Planejamento
  {
    menuId: 'planejamento',
    menuName: 'Planejamento',
    menuLegend: 'Gerenciar metas e planejamento',
    menuIcon: <LuCalendar />,
    menuView: (
      <>
        <PlanejamentoView />
      </>
    ),
    menuCategory: 'Planejamento',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'painel-metas-resultados',
    menuName: 'Painel de Metas e Resultados',
    menuLegend: 'Acompanhar metas e progresso',
    menuIcon: <LuTarget />,
    menuView: <div>PainelMetasResultadosView (a ser implementado)</div>,
    menuCategory: 'Planejamento',
    requiredPermissions: { canManageCampaigns: true },
    menuDisabled: true,
    menuHidden: false
  },

  // Categoria: Histórico (nova categoria)
  {
    menuId: 'historico-eleitor',
    menuName: 'Histórico do Eleitor',
    menuLegend: 'Visualizar interações e demandas',
    menuIcon: <LuHistory />,
    menuView: <div>HistoricoEleitorView (a ser implementado)</div>,
    menuCategory: 'Histórico',
    requiredPermissions: {}, // Todos têm acesso, com restrições via lógica interna
    menuDisabled: true,
    menuHidden: false
  },

  // Categoria: Administração
  {
    menuId: 'gestao-usuarios',
    menuName: 'Gestão de Usuários',
    menuLegend: 'Gerenciar usuários do sistema',
    menuIcon: <LuUsers />,
    menuView: (
      <>
        <GestaoUsuariosView />
      </>
    ),
    menuCategory: 'Administração',
    requiredPermissions: { canEditUsers: true },
    menuDisabled: false,
    menuHidden: false
  },

  // Categoria: Conta
  {
    menuId: 'minha-conta',
    menuName: 'Minha Conta',
    menuLegend: 'Gerenciar dados da conta',
    menuIcon: <LuCircleUser />,
    menuView: (
      <>
        <MinhaContaView />
      </>
    ),
    menuCategory: 'Conta',
    requiredPermissions: {},
    menuDisabled: false,
    menuHidden: true
  }
]

// Menu do usuário (dropdown no header)
export const USER_MENU: IMenu[] = [
  {
    menuId: 'minha-conta',
    menuName: 'Minha Conta',
    menuLegend: 'Gerenciar dados da conta',
    menuIcon: <LuCircleUser />,
    menuView: (
      <>
        <MinhaContaView />
      </>
    ),
    menuCategory: 'Conta',
    requiredPermissions: {},
    menuDisabled: false,
    menuHidden: false
  },
  {
    menuId: 'sair',
    menuName: 'Sair',
    menuLegend: 'Deslogar do sistema',
    menuIcon: <LuLogOut />,
    menuView: null,
    menuCategory: 'Conta',
    requiredPermissions: {},
    menuDisabled: false,
    menuHidden: false
  }
]

// Função para filtrar menus com base nas permissões do usuário
export const getMenusForUser = (user: UserType): IMenu[] => {
  return DASHBOARD_MENUS.filter((menu) => {
    const perms = menu.requiredPermissions
    return Object.keys(perms).every((key) => {
      const permKey = key as keyof Permissions
      return (
        perms[permKey] === undefined ||
        user.permissions[permKey] === perms[permKey]
      )
    })
  })
}

// Função para obter categorias únicas
export const getMenuCategories = (menus: IMenu[]): string[] => {
  return [...new Set(menus.map((menu) => menu.menuCategory))]
}

// Função para formatar os menus no formato do Ant Design
export const formatMenusForAntDesign = (
  user: UserType
): GetProp<MenuProps, 'items'> => {
  const userMenus = getMenusForUser(user)
  const categories = getMenuCategories(userMenus)

  return categories
    .map((category) => {
      const visibleMenus = userMenus.filter(
        (menu) => menu.menuCategory === category && !menu.menuHidden
      )

      if (visibleMenus.length === 0) return null

      return {
        key: `category-${category.toLowerCase().replace(' ', '-')}`,
        label: category,
        type: 'group',
        children: visibleMenus.map((menu) => ({
          key: menu.menuId,
          icon: menu.menuIcon,
          label: menu.menuName,
          disabled: menu.menuDisabled,
          title: menu.menuName
        }))
      }
    })
    .filter((item) => item !== null) as GetProp<MenuProps, 'items'>
}
