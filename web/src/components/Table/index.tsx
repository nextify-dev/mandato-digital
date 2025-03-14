// src/components/Table.tsx

import * as S from './styles'

import { TableProps as AntTableProps } from 'antd'
import { StyledTable, TableEmptyResult } from '@/utils/styles/antd'

export interface TableColumn<T> {
  title: string
  dataIndex?: keyof T | string | string[]
  key: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  sorter?: (a: T, b: T) => number
  filters?: { text: string; value: string | number }[]
  onFilter?: (value: any, record: T) => boolean
  width?: string | number
}

export interface TableProps<T> extends Omit<AntTableProps<T>, 'columns'> {
  columns: TableColumn<T>[]
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  loading?: boolean
  pagination?:
    | false
    | {
        pageSize?: number
        current?: number
        total?: number
        onChange?: (page: number, pageSize: number) => void
      }
  onRowClick?: (record: T) => void
  empty?: number
  disabledRowKey?: string
}

const Table = <T extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  pagination = { pageSize: 10 },
  onRowClick,
  disabledRowKey,
  ...rest
}: TableProps<T>) => {
  let locale = {
    emptyText: (
      <TableEmptyResult
        icon={<img src="/empty.png" alt="" />}
        title="Sem dados"
        subTitle="Não há informações para exibir no momento."
      />
    )
  }

  return (
    <StyledTable<T>
      locale={locale}
      columns={columns as any}
      dataSource={dataSource}
      rowKey={rowKey as any}
      loading={loading}
      pagination={pagination}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : 'default' }
      })}
      rowClassName={(record) => {
        const key =
          typeof rowKey === 'function' ? rowKey(record) : record[rowKey]
        return key === disabledRowKey ? 'ant-table-row-disabled' : ''
      }}
      size="small"
      empty={dataSource.length === 0 ? 1 : 0}
      {...rest}
    />
  )
}

export default Table
