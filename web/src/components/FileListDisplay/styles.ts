// src/components/FileListDisplay/styles.ts

import styled from 'styled-components'
import { Card, List, Input, Button } from 'antd'

import { Screen } from '@/utils/styles/commons'
import { color, textColor } from '@/utils/styles/colors'
import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'

export const FileListDisplay = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  margin-top: 10px;

  .ant-list-items {
    display: flex;
    flex-direction: column;
    row-gap: 6px;
  }
`

export const FileListDisplayTitle = styled.h2`
  ${fontSize('small')}
  ${fontHeight('small')}
  ${fontWeight('medium')}
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
`

export const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`

export const SearchInput = styled(Input)`
  max-width: 300px;
  width: 100%;
`

export const FileCard = styled.div`
  display: flex;
  align-items: center;
  column-gap: 10px;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid ${color('colorBorderSecondary')};
`

export const FilePreview = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;

  .ant-image,
  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;

    ${fontSize('xxxs')}
    ${fontHeight('xxxs')}
  }

  .ant-image-mask-info {
    padding: 5px 5px 5px 10px !important;
  }
`

export const FileExtension = styled.div`
  ${fontSize('xxs')}
  ${fontHeight('xxs')}
  ${fontWeight('bold')}
  
  ${textColor('colorTextLabel')}
`

export const FileDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  row-gap: 5px;
`

export const FileOptions = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  column-gap: 5px;
`

export const FileDetailsName = styled.p`
  ${fontSize('xxs')}
  ${fontHeight('xxs')}


  b {
    ${fontWeight('medium')}
  }
`

export const FileDetailsType = styled.p`
  ${fontSize('xxs')}
  ${fontHeight('xxs')}


  b {
    ${fontWeight('medium')}
  }
`

export const DownloadAllButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`
