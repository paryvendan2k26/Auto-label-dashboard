import { useState } from 'react';
import { Card, Button, Space, message, Descriptions } from 'antd';
import { DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';

function Export({ datasetId, datasetName }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiService.exportDataset(datasetId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${datasetName}-labeled.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Dataset exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export dataset');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card 
      title={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> Export Labeled Dataset</>}
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ 
          padding: 24, 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <h2 style={{ marginTop: 16, color: '#52c41a' }}>
            Labeling Complete!
          </h2>
          <p style={{ fontSize: 16, color: '#666' }}>
            Your dataset has been successfully labeled and is ready for export.
          </p>
        </div>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="Export Format">CSV</Descriptions.Item>
          <Descriptions.Item label="Includes">
            Original data + AI labels + Confidence scores + Human reviews
          </Descriptions.Item>
          <Descriptions.Item label="File Name">
            {datasetName}-labeled.csv
          </Descriptions.Item>
        </Descriptions>

        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
          block
        >
          {exporting ? 'Exporting...' : 'Download Labeled Dataset'}
        </Button>

        <div style={{ 
          padding: 16, 
          background: '#e6f7ff', 
          border: '1px solid #91d5ff',
          borderRadius: 4,
          fontSize: 12
        }}>
          <strong>📝 Note:</strong> The exported CSV includes all original columns plus:
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li><code>ai_label</code> - Label assigned by AI</li>
            <li><code>ai_confidence</code> - Confidence score (0-1)</li>
            <li><code>ai_reasoning</code> - AI's reasoning for the label</li>
            <li><code>human_label</code> - Your corrected label (if modified)</li>
            <li><code>review_status</code> - auto_accepted, needs_review, etc.</li>
            <li><code>reviewed_at</code> - Timestamp of human review</li>
          </ul>
        </div>
      </Space>
    </Card>
  );
}

export default Export;