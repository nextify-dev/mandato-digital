// src/components/FileListDisplay/styles.ts

import styled from 'styled-components'
import { Card } from 'antd'

import { Screen } from '@/utils/styles/commons'
import { color } from '@/utils/styles/colors'
import { font } from '@/utils/styles/fonts'

export const FileListDisplay = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
`

export const FileListDisplayTitle = styled.h2`
  ${font('small')}
  font-weight: 500;
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

    ${font('xxxs')}
  }

  .ant-image-mask-info {
    padding: 5px 5px 5px 10px !important;
  }
`

export const FileExtension = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #666;
`

export const FileDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  row-gap: 5px;
`

export const FileDetailsName = styled.p`
  ${font('xxs')}

  b {
    font-weight: 500;
  }
`

export const FileDetailsType = styled.p`
  ${font('xxs')}

  b {
    font-weight: 500;
  }
`
