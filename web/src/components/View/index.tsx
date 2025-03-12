// src/components/View/index.tsx

import * as S from './styles'

import {
  View as ViewCommon,
  ViewContent,
  ViewHeader
} from '@/utils/styles/commons'

interface ViewProps {
  header?: React.ReactNode
  children: React.ReactNode
}

const View = ({ header, children }: ViewProps) => {
  return (
    <ViewCommon>
      <ViewHeader>{header}</ViewHeader>
      <ViewContent>{children}</ViewContent>
    </ViewCommon>
  )
}

export default View
