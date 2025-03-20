// src/components/FileListDisplay/index.tsx

import React, { useState, useEffect } from 'react'
import * as S from './styles'
import { List, Image, Button, Tooltip, message } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import { LuDownload } from 'react-icons/lu'
import { StyledTooltip } from '@/utils/styles/antd'
import { getTypeLabel } from '@/utils/functions/firebaseUtils'

interface FileListDisplayProps {
  files?: UploadFile[] | null
  viewOnly?: boolean
}

interface FileInfo {
  url: string
  name: string
  type: string
  extension: string
}

const FileListDisplay: React.FC<FileListDisplayProps> = ({
  files,
  viewOnly = false
}) => {
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([])
  const [downloading, setDownloading] = useState<string | null>(null) // Estado para indicar qual arquivo está sendo baixado
  const [messageApi, contextHolder] = message.useMessage()

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

  // Função para fazer o download do arquivo
  const handleDownload = async (file: FileInfo) => {
    setDownloading(file.url) // Marca o arquivo como "baixando"
    try {
      // Faz uma requisição para buscar o arquivo
      const response = await fetch(file.url, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(
          'Falha ao baixar o arquivo. Verifique a URL ou as permissões.'
        )
      }

      // Converte a resposta em um blob
      const blob = await response.blob()

      // Cria um URL temporário para o blob
      const url = window.URL.createObjectURL(blob)

      // Cria um link temporário para iniciar o download
      const link = document.createElement('a')
      link.href = url
      link.download = file.name // Define o nome do arquivo para o download
      document.body.appendChild(link)
      link.click()

      // Limpa o link temporário
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      messageApi.success(`Download de "${file.name}" iniciado com sucesso!`)
    } catch (error) {
      console.error(`Erro ao baixar o arquivo ${file.name}:`, error)
      messageApi.error(
        `Erro ao baixar o arquivo "${file.name}". Tente novamente ou verifique a URL.`
      )
    } finally {
      setDownloading(null) // Remove o estado de "baixando"
    }
  }

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

  return (
    <S.FileListDisplay>
      {contextHolder}
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
            <S.FileOptions>
              {!viewOnly && (
                <StyledTooltip
                  placement="topRight"
                  title="Fazer download do arquivo"
                  arrow
                >
                  <Button
                    icon={<LuDownload />}
                    size="small"
                    onClick={() => handleDownload(file)}
                    loading={downloading === file.url}
                    disabled={downloading === file.url}
                  />
                </StyledTooltip>
              )}
            </S.FileOptions>
          </S.FileCard>
        )}
        locale={{ emptyText: 'Nenhum arquivo anexado' }}
      />
    </S.FileListDisplay>
  )
}

export default FileListDisplay
