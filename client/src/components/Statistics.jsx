import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Space, Spin } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  DollarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../services/api';
import { formatNumber, formatPercent } from '../utils/formatters';

const COLORS = ['#52c41a', '#faad14', '#ff4d4f', '#1890ff', '#722ed1'];

function Statistics({ datasetId }) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;
    fetchStatistics();
  }, [datasetId]);

  const fetchStatistics = async () => {
    try {
      const response = await apiService.getStatistics(datasetId);
      setStatistics(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title="📊 Statistics Dashboard" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  const { dataset, progress, stats, labelDistribution, confidenceDistribution, avgConfidence } = statistics;

  // Prepare chart data
  const labelChartData = labelDistribution.map(item => ({
    name: item.label,
    value: item.count,
    percentage: item.percentage
  }));

  const reviewStatusData = [
    { name: 'Auto Accepted', value: stats.autoAcceptedItems, color: '#52c41a' },
    { name: 'Needs Review', value: stats.needsReviewItems, color: '#faad14' },
    { name: 'Low Confidence', value: stats.lowConfidenceItems, color: '#ff4d4f' },
  ].filter(item => item.value > 0);

  // Prepare confidence distribution histogram data
  const confidenceHistogramData = confidenceDistribution?.map(item => ({
    range: item.range,
    count: item.count
  })) || [];

  // Calculate metrics
  const timeSaved = Math.round(stats.totalItems * 0.02 / 60); // 2 sec per item manually
  const costEstimate = (stats.totalItems * 0.0015).toFixed(2);

  return (
    <Card title="📊 Statistics Dashboard" style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* Summary Cards */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Items"
                value={formatNumber(stats.totalItems)}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Labeled"
                value={formatNumber(stats.labeledItems)}
                suffix={`/ ${stats.totalItems}`}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Confidence"
                value={formatPercent(avgConfidence * 100)}
                valueStyle={{ color: avgConfidence > 0.8 ? '#3f8600' : '#faad14' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Time Saved"
                value={timeSaved}
                suffix="hours"
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Review Status Breakdown */}
        <Card title="🎯 Review Status Breakdown" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Auto-Accepted"
                value={formatNumber(stats.autoAcceptedItems)}
                suffix={`(${formatPercent((stats.autoAcceptedItems / stats.totalItems) * 100)})`}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Needs Review"
                value={formatNumber(stats.needsReviewItems)}
                suffix={`(${formatPercent((stats.needsReviewItems / stats.totalItems) * 100)})`}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Low Confidence"
                value={formatNumber(stats.lowConfidenceItems)}
                suffix={`(${formatPercent((stats.lowConfidenceItems / stats.totalItems) * 100)})`}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Charts */}
        <Row gutter={16}>
          {/* Label Distribution */}
          <Col xs={24} lg={8}>
            <Card title="📊 Label Distribution" size="small">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={labelChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {labelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Confidence Distribution Histogram */}
          <Col xs={24} lg={8}>
            <Card title="📈 Confidence Distribution" size="small">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confidenceHistogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="range" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#1890ff">
                    {confidenceHistogramData.map((entry, index) => {
                      // Color based on confidence range
                      let color = '#1890ff';
                      if (entry.range.includes('0.9-1.0')) color = '#52c41a';
                      else if (entry.range.includes('0.8-0.9') || entry.range.includes('0.7-0.8')) color = '#faad14';
                      else if (entry.range.includes('0.5-0.7') || entry.range.includes('0.0-0.5')) color = '#ff4d4f';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Review Status Chart */}
          <Col xs={24} lg={8}>
            <Card title="⚡ Review Status" size="small">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reviewStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {reviewStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Cost Analysis */}
        <Card 
          title="💰 Cost Analysis" 
          size="small"
          style={{ background: '#f0f5ff' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Estimated API Cost"
                value={`$${costEstimate}`}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DollarOutlined />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Based on gpt-4o-mini pricing
              </div>
            </Col>
            <Col span={12}>
              <Statistic
                title="Cost per Item"
                value="$0.0015"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                vs $0.50 manual labeling
              </div>
            </Col>
          </Row>
        </Card>

        {/* Dataset Info */}
        <Card title="ℹ️ Dataset Information" size="small">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <strong>Name:</strong> {dataset.name}
            </Col>
            <Col span={12}>
              <strong>Status:</strong>{' '}
              <Tag color={dataset.status === 'completed' ? 'success' : 'processing'}>
                {dataset.status}
              </Tag>
            </Col>
            <Col span={12}>
              <strong>Created:</strong> {new Date(dataset.createdAt).toLocaleString()}
            </Col>
            {dataset.completedAt && (
              <Col span={12}>
                <strong>Completed:</strong> {new Date(dataset.completedAt).toLocaleString()}
              </Col>
            )}
          </Row>
        </Card>

      </Space>
    </Card>
  );
}

export default Statistics;