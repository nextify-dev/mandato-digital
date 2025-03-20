// src/components/FileUploadCard.tsx

import * as S from './styles'

import { FormMode } from '@/@types/user'
import {
  FileCard,
  FilePreview,
  FileDetails,
  FileDetailsName,
  FileDetailsType,
  FileOptions
} from '@/components/FileListDisplay/styles'
import { getTypeLabel } from '@/utils/functions/storageUtils'
import { Button, Progress, Spin } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import { DeleteOutlined } from '@ant-design/icons'

interface IFileUploadCardProps {
  file: UploadFile
  mode: any
  handleRemove: (file: UploadFile) => void
}

const FileUploadCard = ({ file, mode, handleRemove }: IFileUploadCardProps) => {
  const renderFilePreview = (file: UploadFile) => {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'desconhecido'
    const type = file.type || 'other'

    if (file.status === 'uploading') {
      return <Spin />
    }

    if (type === 'image' && file.url) {
      return (
        <img
          src={file.url}
          alt={file.name}
          style={{ width: 50, height: 50, objectFit: 'cover' }}
        />
      )
    } else if (type === 'video' && file.url) {
      return (
        <video controls muted style={{ width: 50, height: 50 }}>
          <source src={file.url} type={`video/${extension}`} />
        </video>
      )
    } else {
      return <span style={{ fontSize: 12, color: '#888' }}>.{extension}</span>
    }
  }

  return (
    <FileCard>
      <FilePreview>{renderFilePreview(file)}</FilePreview>
      <FileDetails>
        <FileDetailsName>{file.name}</FileDetailsName>
        <FileDetailsType>
          <b>Tipo do Arquivo:</b> {getTypeLabel(file.type)}
        </FileDetailsType>
        {file.status !== 'done' && (
          <Progress
            percent={file.percent || 0}
            size="small"
            style={{ width: '100%' }}
          />
        )}
      </FileDetails>
      <FileOptions>
        {mode !== 'viewOnly' && (
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleRemove(file)}
            style={{ marginLeft: 8 }}
          />
        )}
      </FileOptions>
    </FileCard>
  )
}

export default FileUploadCard
