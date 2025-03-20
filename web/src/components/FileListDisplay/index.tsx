// src/components/FileListDisplay/index.tsx

import React, { useState, useEffect } from 'react'
import * as S from './styles'
import { List, Image, Button, Checkbox } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import { LuDownload } from 'react-icons/lu'
import { StyledTooltip } from '@/utils/styles/antd'
import { getTypeLabel } from '@/utils/functions/storageUtils'

interface FileListDisplayProps {
  files?: UploadFile[] | null
  viewOnly?: boolean
}

interface FileInfo {
  url?: string // URL do Storage (para arquivos já salvos) ou URL temporária (para arquivos locais)
  name: string
  type: string
  extension: string
  originFileObj?: File // Para arquivos locais que ainda não foram salvos no Storage final
}

const FileListDisplay: React.FC<FileListDisplayProps> = ({
  files,
  viewOnly = false
}) => {
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([])
  const [filteredFileInfos, setFilteredFileInfos] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Mapa para armazenar URLs temporárias geradas para arquivos locais
  const [localUrls, setLocalUrls] = useState<Map<string, string>>(new Map())

  // Gera URLs temporárias para arquivos locais e limpa quando o componente é desmontado
  useEffect(() => {
    const newLocalUrls = new Map<string, string>()
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (
          !file.url &&
          file.originFileObj &&
          file.originFileObj instanceof File
        ) {
          const localUrl = URL.createObjectURL(file.originFileObj)
          newLocalUrls.set(file.uid, localUrl)
        }
      })
    }
    setLocalUrls(newLocalUrls)

    return () => {
      // Limpa as URLs temporárias ao desmontar o componente
      newLocalUrls.forEach((url) => URL.revokeObjectURL(url))
      setLocalUrls(new Map())
    }
  }, [files])

  // Atualiza a lista de fileInfos com base nos arquivos recebidos
  useEffect(() => {
    if (files && files.length > 0) {
      const infos = files.map((file) => {
        const extension =
          file.name.split('.').pop()?.toLowerCase() || 'desconhecido'
        const type = file.type || 'other'
        const url = file.url || localUrls.get(file.uid)

        return {
          url,
          name: file.name || 'Arquivo sem nome',
          type,
          extension,
          originFileObj:
            file.originFileObj instanceof File ? file.originFileObj : undefined
        }
      })
      setFileInfos(infos)
      setFilteredFileInfos(infos)
    } else {
      setFileInfos([])
      setFilteredFileInfos([])
      setSelectedFiles([])
    }
  }, [files, localUrls])

  // Filtra os arquivos com base no termo de pesquisa
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFileInfos(fileInfos)
    } else {
      const filtered = fileInfos.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFileInfos(filtered)
      setSelectedFiles((prev) =>
        prev.filter((url) => filtered.some((file) => file.url === url))
      )
    }
  }, [searchTerm, fileInfos])

  // Função para fazer o download de um único arquivo
  const handleDownload = async (file: FileInfo) => {
    if (!file.url) return

    setDownloading(file.url)
    try {
      if (
        file.originFileObj &&
        !file.url.startsWith('https://firebasestorage.googleapis.com')
      ) {
        // Download de arquivo local (ainda não salvo no Storage final)
        const url = URL.createObjectURL(file.originFileObj)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Download de arquivo já salvo no Storage
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
      }
    } catch (error) {
      console.error(`Erro ao baixar o arquivo ${file.name}:`, error)
    } finally {
      setDownloading(null)
    }
  }

  // Função para baixar todos os arquivos selecionados (ou todos, se não houver seleção)
  const handleDownloadSelected = async () => {
    const filesToDownload =
      selectedFiles.length > 0
        ? fileInfos.filter(
            (file) => file.url && selectedFiles.includes(file.url)
          )
        : fileInfos.filter((file) => file.url)

    if (filesToDownload.length === 0) {
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
    setSelectedFiles(filteredFileInfos.map((file) => file.url!).filter(Boolean))
  }

  // Função para limpar a seleção
  const handleClearSelection = () => {
    setSelectedFiles([])
  }

  const renderFilePreview = (file: FileInfo) => {
    if (!file.url) {
      return <S.FileExtension>.{file.extension}</S.FileExtension>
    }

    if (file.type.startsWith('image')) {
      return (
        <Image
          src={file.url}
          alt={file.name}
          preview={true}
          style={{ width: '100%', height: '100%' }}
        />
      )
    } else if (file.type.startsWith('video')) {
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
              checked={file.url ? selectedFiles.includes(file.url) : false}
              onChange={(e) =>
                file.url && handleSelectFile(file.url, e.target.checked)
              }
              style={{ marginRight: 10 }}
              disabled={viewOnly || !file.url}
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
                    loading={file.url ? downloading === file.url : false}
                    disabled={
                      !file.url || (file.url ? downloading === file.url : false)
                    }
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
            disabled={
              downloading !== null ||
              filteredFileInfos.every((file) => !file.url)
            }
          >
            {getDownloadButtonLabel()}
          </Button>
        </S.DownloadAllButtonWrapper>
      )}
    </S.FileListDisplay>
  )
}

export default FileListDisplay
