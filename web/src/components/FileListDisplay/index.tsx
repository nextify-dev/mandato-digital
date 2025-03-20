// src/components/FileListDisplay/index.tsx

import React, { useState, useEffect } from 'react'
import * as S from './styles'
import { List, Image, Typography, Space } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import { StyledCard } from '@/utils/styles/antd'

interface FileListDisplayProps {
  files?: UploadFile[] | null // Arquivos no formato UploadFile do Ant Design
}

interface FileInfo {
  url: string
  name: string
  type: string
  extension: string
}

// Componente para exibir a lista de arquivos
const FileListDisplay: React.FC<FileListDisplayProps> = ({ files }) => {
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([])

  // Função para extrair informações do arquivo a partir do UploadFile
  const extractFileInfo = (file: UploadFile): FileInfo => {
    // Usa a URL fornecida pelo UploadFile, se disponível
    const url = file.url || ''
    // Usa o nome do arquivo fornecido pelo UploadFile
    const fileName = file.name || 'Arquivo sem nome'
    // Usa a extensão fornecida pelo UploadFile, ou extrai do nome
    const extension =
      (file as any).extension ||
      fileName.split('.').pop()?.toLowerCase() ||
      'desconhecido'
    // Usa o tipo fornecido pelo UploadFile
    const type = (file as any).type || 'other'
    return { url, name: fileName, type, extension }
  }

  // Carrega as informações dos arquivos ao receber a prop files
  useEffect(() => {
    if (files && files.length > 0) {
      const infos = files
        .filter((file): file is UploadFile & { url: string } => !!file.url) // Garante que só processa arquivos com URL
        .map((file) => extractFileInfo(file))
      setFileInfos(infos)
    } else {
      setFileInfos([])
    }
  }, [files])

  // Renderiza a prévia do arquivo
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

  // Mapeia o tipo para um texto legível
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
