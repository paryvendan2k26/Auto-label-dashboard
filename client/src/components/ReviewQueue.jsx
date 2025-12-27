import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Select, Modal, Input, message, Tooltip } from 'antd';
import { 
  CheckOutlined, 
  EditOutlined, 
  EyeOutlined,
  SyncOutlined 
} from '@ant-design/icons';
import { apiService } from '../services/api';
import { formatConfidence, getReviewStatusColor } from '../utils/formatters';

const { Option } = Select;
const { TextArea } = Input;

function ReviewQueue({ datasetId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [sortBy, setSortBy] = useState('confidence');
  const [summary, setSummary] = useState(null);
  
  // Modal states
  const [reviewModal, setReviewModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    if (!datasetId) return;
    fetchSummary();
    fetchQueue();
  }, [datasetId, pagination.current, sortBy]);

  const fetchSummary = async () => {
    try {
      const response = await apiService.getQueueSummary(datasetId);
      setSummary(response.data.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await apiService.getReviewQueue(datasetId, {
        page: pagination.current,
        limit: pagination.pageSize,
        sort: sortBy
      });

      const data = response.data.data;
      setItems(data.items);
      setPagination({
        ...pagination,
        total: data.pagination.totalItems
      });
    } catch (error) {
      console.error('Error fetching queue:', error);
      message.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (item) => {
    try {
      await apiService.acceptLabel(item._id);
      message.success('Label accepted!');
      fetchQueue();
      fetchSummary();
    } catch (error) {
      message.error('Failed to accept label');
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setNewLabel(item.aiLabel);
    setReviewModal(true);
  };

  const handleSaveEdit = async () => {
    if (!newLabel.trim()) {
      message.warning('Please enter a label');
      return;
    }

    try {
      await apiService.modifyLabel(currentItem._id, newLabel.trim());
      message.success('Label updated!');
      setReviewModal(false);
      setCurrentItem(null);
      setNewLabel('');
      fetchQueue();
      fetchSummary();
    } catch (error) {
      message.error('Failed to update label');
    }
  };

  const columns = [
    {
      title: 'Content',
      dataIndex: 'originalData',
      key: 'content',
      render: (data) => {
        const text = data.text || data.review || data.content || JSON.stringify(data);
        return (
          <Tooltip title={text}>
            <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'AI Label',
      dataIndex: 'aiLabel',
      key: 'aiLabel',
      width: 120,
      render: (label) => <Tag color="blue">{label}</Tag>,
    },
    {
      title: 'Confidence',
      dataIndex: 'aiConfidence',
      key: 'confidence',
      width: 100,
      render: (confidence) => (
        <Tag color={confidence >= 0.9 ? 'green' : confidence >= 0.7 ? 'orange' : 'red'}>
          {formatConfidence(confidence)}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'reviewStatus',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getReviewStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleAccept(record)}
          >
            Accept
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card 
        title="📋 Review Queue" 
        extra={
          <Space>
            <span>Sort by:</span>
            <Select 
              value={sortBy} 
              onChange={(value) => {
                setSortBy(value);
                setPagination({ ...pagination, current: 1 });
              }}
              style={{ width: 150 }}
            >
              <Option value="confidence">Confidence ↑</Option>
              <Option value="recent">Recent First</Option>
              <Option value="random">Random</Option>
            </Select>
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchQueue}
            >
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {summary && (
          <Card 
            size="small" 
            style={{ marginBottom: 16, background: '#f0f5ff' }}
            title="📊 Queue Summary"
          >
            <Space size="large" wrap>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Items</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{summary.total}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Auto-Accepted</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                  {summary.auto_accepted}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Needs Review</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                  {summary.needs_review}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Low Confidence</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
                  {summary.low_confidence}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Pending Review</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {summary.pendingReview}
                </div>
              </div>
            </Space>
          </Card>
        )}

        <Table
          columns={columns}
          dataSource={items}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={(newPagination) => setPagination(newPagination)}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={<><EyeOutlined /> Review Item</>}
        open={reviewModal}
        onOk={handleSaveEdit}
        onCancel={() => {
          setReviewModal(false);
          setCurrentItem(null);
        }}
        okText="Save Changes"
      >
        {currentItem && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <strong>Original Text:</strong>
              <div style={{ 
                marginTop: 8, 
                padding: 12, 
                background: '#f5f5f5', 
                borderRadius: 4 
              }}>
                {currentItem.originalData.text || 
                 currentItem.originalData.review || 
                 JSON.stringify(currentItem.originalData)}
              </div>
            </div>

            <div>
              <strong>AI Label:</strong> <Tag color="blue">{currentItem.aiLabel}</Tag>
              <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                Confidence: {formatConfidence(currentItem.aiConfidence)}
              </div>
            </div>

            {currentItem.aiReasoning && (
              <div>
                <strong>AI Reasoning:</strong>
                <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                  {currentItem.aiReasoning}
                </div>
              </div>
            )}

            <div>
              <strong>Your Label:</strong>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Enter new label"
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
}

export default ReviewQueue;