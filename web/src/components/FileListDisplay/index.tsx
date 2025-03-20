// src/components/FileListDisplay/index.tsx

import React, { useState, useEffect } from 'react'
import * as S from './styles'
import { List, Image, Button, Tooltip, message, Input, Checkbox } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import { LuDownload } from 'react-icons/lu'
import { StyledTooltip } from '@/utils/styles/antd'
import { getTypeLabel } from '@/utils/functions/storageUtils'

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
  const [filteredFileInfos, setFilteredFileInfos] = useState<FileInfo[]>([]) // Lista filtrada para exibição
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]) // URLs dos arquivos selecionados
  const [downloading, setDownloading] = useState<string | null>(null) // Estado para indicar qual arquivo está sendo baixado
  const [searchTerm, setSearchTerm] = useState<string>('') // Termo de pesquisa
  const [messageApi, contextHolder] = message.useMessage()

  // console.log(files)

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
      setFilteredFileInfos(infos) // Inicialmente, a lista filtrada é igual à lista completa
    } else {
      setFileInfos([])
      setFilteredFileInfos([])
      setSelectedFiles([]) // Limpa a seleção quando não há arquivos
    }
  }, [files])

  // Função para filtrar os arquivos com base no termo de pesquisa
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFileInfos(fileInfos)
    } else {
      const filtered = fileInfos.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFileInfos(filtered)
      // Atualiza a seleção para incluir apenas os arquivos que ainda estão na lista filtrada
      setSelectedFiles((prev) =>
        prev.filter((url) => filtered.some((file) => file.url === url))
      )
    }
  }, [searchTerm, fileInfos])

  // Função para fazer o download de um único arquivo
  const handleDownload = async (file: FileInfo) => {
    setDownloading(file.url) // Marca o arquivo como "baixando"
    try {
      const response = await fetch(file.url, { method: 'GET' })
      if (!response.ok) {
        throw new Error(
          'Falha ao baixar o arquivo. Verifique a URL ou as permissões.'
        )
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      messageApi.success(`Download de "${file.name}" iniciado com sucesso!`)
    } catch (error) {
      console.error(`Erro ao baixar o arquivo ${file.name}:`, error)
      messageApi.error(
        `Erro ao baixar o arquivo "${file.name}". Tente novamente ou verifique a URL.`
      )
    } finally {
      setDownloading(null)
    }
  }

  // Função para baixar todos os arquivos selecionados (ou todos, se não houver seleção)
  const handleDownloadSelected = async () => {
    const filesToDownload =
      selectedFiles.length > 0
        ? fileInfos.filter((file) => selectedFiles.includes(file.url))
        : fileInfos

    if (filesToDownload.length === 0) {
      messageApi.warning('Nenhum arquivo para baixar.')
      return
    }

    for (const file of filesToDownload) {
      await handleDownload(file)
    }
  }

  // Função para selecionar ou desmarcar um arquivo
  const handleSelectFile = (fileUrl: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles((prev) => [...prev, fileUrl])
    } else {
      setSelectedFiles((prev) => prev.filter((url) => url !== fileUrl))
    }
  }

  // Função para selecionar todos os arquivos
  const handleSelectAll = () => {
    setSelectedFiles(filteredFileInfos.map((file) => file.url))
  }

  // Função para limpar a seleção
  const handleClearSelection = () => {
    setSelectedFiles([])
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

  // Determina a label do botão de download
  const getDownloadButtonLabel = () => {
    const selectedCount = selectedFiles.length
    if (selectedCount === 0 || selectedCount === filteredFileInfos.length) {
      return 'Baixar Todos'
    }
    return `Baixar (${selectedCount}) ${
      selectedCount === 1 ? 'arquivo' : 'arquivos'
    }`
  }

  return (
    <S.FileListDisplay>
      {contextHolder}
      <S.FileListDisplayTitle>Arquivos Anexados</S.FileListDisplayTitle>

      {/* Header com botões e input de pesquisa */}
      <S.Header>
        <S.ButtonGroup>
          {/* <Button
            onClick={handleSelectAll}
            disabled={
              selectedFiles.length === filteredFileInfos.length ||
              filteredFileInfos.length === 0
            }
          >
            Selecionar Todos
          </Button> */}
          <Button
            onClick={handleClearSelection}
            disabled={selectedFiles.length === 0}
          >
            Limpar Seleção
          </Button>
        </S.ButtonGroup>
        <S.SearchInput
          placeholder="Pesquisar arquivos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </S.Header>

      <List
        dataSource={filteredFileInfos}
        renderItem={(file) => (
          <S.FileCard>
            <Checkbox
              checked={selectedFiles.includes(file.url)}
              onChange={(e) => handleSelectFile(file.url, e.target.checked)}
              style={{ marginRight: 10 }}
              disabled={viewOnly}
            />
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

      {/* Botão de download no final */}
      {filteredFileInfos.length > 0 && !viewOnly && (
        <S.DownloadAllButtonWrapper>
          <Button
            type="primary"
            icon={<LuDownload />}
            onClick={handleDownloadSelected}
            loading={downloading !== null}
            disabled={downloading !== null}
          >
            {getDownloadButtonLabel()}
          </Button>
        </S.DownloadAllButtonWrapper>
      )}
    </S.FileListDisplay>
  )
}

export default FileListDisplay
