import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Typography, message, Spin } from 'antd';
import { 
  HistoryOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { formatDate, getStatusColor, formatNumber } from '../utils/formatters';

const { Title } = Typography;

function HistoryPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllDatasets();
      setDatasets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      message.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (datasetId, datasetName) => {
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
      
      message.success('Dataset downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download dataset. Make sure labeling is complete.');
    }
  };

  const columns = [
    {
      title: 'Dataset Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <FileTextOutlined style={{ color: '#00684A' }} />
          <span style={{ fontWeight: 600 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Upload Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = getStatusColor(status);
        const statusLabels = {
          uploaded: 'Uploaded',
          configured: 'Configured',
          labeling: 'Labeling',
          completed: 'Completed',
          error: 'Error',
        };
        return (
          <Tag color={color} style={{ fontWeight: 600, padding: '4px 12px' }}>
            {statusLabels[status] || status}
          </Tag>
        );
      },
    },
    {
      title: 'Item Count',
      dataIndex: 'itemCount',
      key: 'itemCount',
      render: (count) => formatNumber(count),
      sorter: (a, b) => a.itemCount - b.itemCount,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Link to={`/dataset/${record._id}`}>
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              size="small"
            >
              View Details
            </Button>
          </Link>
          <Button 
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => handleDownload(record._id, record.name)}
            disabled={record.status !== 'completed'}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #E8F5F1 0%, #F4FAF8 100%)',
          border: 'none',
        }}
      >
        <Space>
          <HistoryOutlined style={{ fontSize: 32, color: '#00684A' }} />
          <Title level={2} style={{ margin: 0, color: '#001E2B' }}>
            Dataset History
          </Title>
        </Space>
      </Card>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : datasets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#C1C7CD', marginBottom: 16 }} />
            <Title level={4} style={{ color: '#89979F' }}>
              No datasets found
            </Title>
            <p style={{ color: '#89979F' }}>
              Upload your first dataset to get started
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={datasets}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} datasets`,
            }}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
}

export default HistoryPage;