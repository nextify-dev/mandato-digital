// src/components/FileListDisplay/index.tsx

import React, { useState, useEffect } from 'react'
import * as S from './styles'
import { List, Image } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'

interface FileListDisplayProps {
  files?: UploadFile[] | null
}

interface FileInfo {
  url: string
  name: string
  type: string
  extension: string
}

const FileListDisplay: React.FC<FileListDisplayProps> = ({ files }) => {
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([])

  useEffect(() => {
    if (files && files.length > 0) {
      const infos = files
        .filter((file): file is UploadFile & { url: string } => !!file.url)
        .map((file) => ({
          url: file.url,
          name: file.name || 'Arquivo sem nome',
          type: (file as any).type || 'other',
          extension:
            (file as any).extension ||
            file.name.split('.').pop()?.toLowerCase() ||
            'desconhecido'
        }))
      setFileInfos(infos)
    } else {
      setFileInfos([])
    }
  }, [files])

  const renderFilePreview = (file: FileInfo) => {
    if (file.type === 'image') {
      return (
        <Image
          src={file.url}
          alt={file.name}
          preview={true}
          style={{ width: '100%', height: '100%' }}
        />
      )
    } else if (file.type === 'video') {
      return (
        <video controls muted style={{ width: '100%', height: '100%' }}>
          <source src={file.url} type={`video/${file.extension}`} />
        </video>
      )
    } else {
      return <S.FileExtension>.{file.extension}</S.FileExtension>
    }
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'image':
        return 'Imagem'
      case 'video':
        return 'Vídeo'
      case 'document':
        return 'Documento'
      case 'spreadsheet':
        return 'Tabela'
      default:
        return 'Outro'
    }
  }

  return (
    <S.FileListDisplay>
      <S.FileListDisplayTitle>Arquivos Anexados</S.FileListDisplayTitle>

      <List
        dataSource={fileInfos}
        renderItem={(file) => (
          <S.FileCard>
            <S.FilePreview>{renderFilePreview(file)}</S.FilePreview>
            <S.FileDetails>
              <S.FileDetailsName>
                <b>Nome do arquivo:</b> {file.name}
              </S.FileDetailsName>
              <S.FileDetailsType>
                <b>Tipo do arquivo:</b> {getTypeLabel(file.type)}
              </S.FileDetailsType>
            </S.FileDetails>
          </S.FileCard>
        )}
        locale={{ emptyText: 'Nenhum arquivo anexado' }}
      />
    </S.FileListDisplay>
  )
}

export default FileListDisplay
