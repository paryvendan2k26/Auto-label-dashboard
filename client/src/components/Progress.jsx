import { useState, useEffect } from 'react';
import { Card, Progress as AntProgress, Statistic, Row, Col, Tag, Space } from 'antd';
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  ClockCircleOutlined,
  RocketOutlined 
} from '@ant-design/icons';
import { apiService } from '../services/api';
import { formatNumber } from '../utils/formatters';

function Progress({ datasetId, onComplete }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;

    // Fetch initial progress
    fetchProgress();

    // Poll every 2 seconds
    const interval = setInterval(() => {
      fetchProgress();
    }, 2000);

    return () => clearInterval(interval);
  }, [datasetId]);

  const fetchProgress = async () => {
    try {
      const response = await apiService.getProgress(datasetId);
      const data = response.data.data;
      
      setProgress(data);
      setLoading(false);

      // Notify parent if completed
      if (data.progress.percentage === 100 && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title="📊 Labeling Progress" loading={true} style={{ marginBottom: 24 }} />
    );
  }

  if (!progress) {
    return null;
  }

  const { progress: progressData, status, datasetName } = progress;
  const isComplete = progressData.percentage === 100;
  const isInProgress = status === 'labeling' || (progressData.labeled > 0 && !isComplete);

  return (
    <Card 
      title={
        <Space>
          <span>📊 Labeling Progress</span>
          {isComplete && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          {isInProgress && <SyncOutlined spin style={{ color: '#1890ff' }} />}
        </Space>
      }
      extra={
        <Tag color={isComplete ? 'success' : isInProgress ? 'processing' : 'default'}>
          {isComplete ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
        </Tag>
      }
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>{datasetName}</strong>
          </div>
          <AntProgress
            percent={progressData.percentage}
            status={isComplete ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            style={{ fontSize: 16 }}
          />
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total Items"
              value={formatNumber(progressData.total)}
              prefix={<RocketOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Labeled"
              value={formatNumber(progressData.labeled)}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Remaining"
              value={formatNumber(progressData.remaining)}
              valueStyle={{ color: progressData.remaining > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        {isComplete && (
          <div style={{ 
            padding: 16, 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 4,
            textAlign: 'center'
          }}>
            <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 8 }} />
            <strong style={{ color: '#52c41a' }}>
              All items have been labeled! Ready for review.
            </strong>
          </div>
        )}

        {isInProgress && progressData.labeled > 0 && (
          <div style={{ 
            padding: 12, 
            background: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#666'
          }}>
            <SyncOutlined spin style={{ marginRight: 8 }} />
            AI is currently labeling your data. This page updates automatically every 2 seconds.
          </div>
        )}
      </Space>
    </Card>
  );
}

export default Progress;