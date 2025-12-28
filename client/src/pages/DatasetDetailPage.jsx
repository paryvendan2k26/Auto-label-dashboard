import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Space, Button, Spin, message, Tabs } from 'antd';
import { 
  ArrowLeftOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import Statistics from '../components/Statistics';
import ReviewQueue from '../components/ReviewQueue';
import Export from '../components/Export';
import { formatDate, getStatusColor } from '../utils/formatters';
import { Tag } from 'antd';

const { Title, Paragraph } = Typography;

function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('statistics');

  useEffect(() => {
    if (id) {
      fetchDataset();
    }
  }, [id]);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const response = await apiService.getDataset(id);
      setDataset(response.data.data);
    } catch (error) {
      console.error('Error fetching dataset:', error);
      message.error('Failed to load dataset');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!dataset) {
    return null;
  }

  const tabItems = [
    {
      key: 'statistics',
      label: (
        <Space>
          <BarChartOutlined />
          Summary Statistics
        </Space>
      ),
      children: <Statistics datasetId={id} />,
    },
    {
      key: 'review',
      label: (
        <Space>
          <CheckSquareOutlined />
          Review Queue
        </Space>
      ),
      children: <ReviewQueue datasetId={id} />,
    },
    {
      key: 'export',
      label: (
        <Space>
          <DownloadOutlined />
          Export
        </Space>
      ),
      children: <Export datasetId={id} datasetName={dataset.name} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #E8F5F1 0%, #F4FAF8 100%)',
          border: 'none',
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/history')}
              style={{ marginRight: 8 }}
            >
              Back to History
            </Button>
          </Space>
          
          <Space align="start" style={{ width: '100%' }}>
            <DatabaseOutlined style={{ fontSize: 32, color: '#00684A', marginTop: 4 }} />
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0, color: '#001E2B' }}>
                {dataset.name}
              </Title>
              <Space style={{ marginTop: 8 }} wrap>
                <Tag color={getStatusColor(dataset.status)} style={{ fontWeight: 600, padding: '4px 12px' }}>
                  {dataset.status}
                </Tag>
                <span style={{ color: '#5C6C75' }}>
                  <strong>Items:</strong> {dataset.itemCount?.toLocaleString() || 0}
                </span>
                <span style={{ color: '#5C6C75' }}>
                  <strong>Uploaded:</strong> {formatDate(dataset.createdAt)}
                </span>
                {dataset.completedAt && (
                  <span style={{ color: '#5C6C75' }}>
                    <strong>Completed:</strong> {formatDate(dataset.completedAt)}
                  </span>
                )}
              </Space>
            </div>
          </Space>
        </Space>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
}

export default DatasetDetailPage;