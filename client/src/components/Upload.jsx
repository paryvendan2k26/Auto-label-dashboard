import { useState } from 'react';
import { Upload as AntUpload, Button, Card, message, Alert } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';

const { Dragger } = AntUpload;

function Upload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    accept: '.csv,.json',
    beforeUpload: (file) => {
      // Validate file type
      const isCSVorJSON = file.type === 'text/csv' || 
                         file.type === 'application/json' ||
                         file.name.endsWith('.csv') ||
                         file.name.endsWith('.json');
      
      if (!isCSVorJSON) {
        message.error('You can only upload CSV or JSON files!');
        return false;
      }

      // Validate file size (10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      setFileList([file]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file first!');
      return;
    }

    setUploading(true);

    try {
      const response = await apiService.uploadDataset(fileList[0]);
      
      message.success('File uploaded successfully!');
      console.log('Upload response:', response.data);
      
      setFileList([]);
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(response.data.data);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.error || 'Upload failed!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card title="📤 Upload Dataset" style={{ marginBottom: 24 }}>
      <Alert
        message="Supported Formats"
        description="Upload CSV or JSON files. Maximum file size: 10MB. Your data will be parsed and stored for labeling."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for CSV and JSON files. Single upload only. File will be validated before processing.
        </p>
      </Dragger>

      <Button
        type="primary"
        onClick={handleUpload}
        loading={uploading}
        disabled={fileList.length === 0}
        icon={<UploadOutlined />}
        style={{ marginTop: 16 }}
        size="large"
      >
        {uploading ? 'Uploading...' : 'Upload Dataset'}
      </Button>
    </Card>
  );
}

export default Upload;