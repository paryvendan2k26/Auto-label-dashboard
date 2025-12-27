import { useState } from 'react';
import { Card, Input, Button, Select, Space, message, Alert } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

function SchemaInput({ datasetId, onConfigureSuccess }) {
  const [schema, setSchema] = useState('');
  const [labelType, setLabelType] = useState('classification');
  const [loading, setLoading] = useState(false);

  const exampleSchemas = {
    sentiment: `Analyze the sentiment of each review and classify as:
- "positive" - customer is satisfied, happy, or praising
- "negative" - customer is disappointed, angry, or complaining
- "neutral" - neither clearly positive nor negative`,

    classification: `Classify each item into ONE category:
- "product_issue" - defects, quality problems, broken items
- "shipping_issue" - delivery delays, damaged packaging
- "service_issue" - customer service complaints
- "positive_feedback" - satisfied customers, praise`,

    entity: `Extract the following entities from each text:
- "product_name" - name of the product mentioned
- "issue_type" - what problem occurred
- "sentiment" - positive, negative, or neutral
Return in JSON format: {"product_name": "...", "issue_type": "...", "sentiment": "..."}`,
  };

  const loadExample = (type) => {
    setSchema(exampleSchemas[type]);
    setLabelType(type);
    message.info(`Loaded ${type} example schema`);
  };

  const handleConfigure = async () => {
    if (!schema.trim()) {
      message.warning('Please provide labeling instructions!');
      return;
    }

    if (schema.trim().length < 20) {
      message.warning('Schema should be at least 20 characters for best results!');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.configureDataset(datasetId, {
        labelingSchema: schema.trim(),
        labelType: labelType,
      });

      message.success('Schema configured successfully!');
      console.log('Configure response:', response.data);

      if (onConfigureSuccess) {
        onConfigureSuccess(response.data.data);
      }
    } catch (error) {
      console.error('Configure error:', error);
      message.error(error.response?.data?.error || 'Configuration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="📝 Define Labeling Schema" style={{ marginBottom: 24 }}>
      <Alert
        message="Schema Guide"
        description="Provide clear instructions on how to label your data. The more specific you are, the better the AI will perform. Include examples of each label category."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Label Type:
          </label>
          <Select
            value={labelType}
            onChange={setLabelType}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="classification">Classification (categories)</Option>
            <Option value="sentiment">Sentiment Analysis</Option>
            <Option value="entity">Entity Extraction</Option>
            <Option value="custom">Custom</Option>
          </Select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Quick Examples:
          </label>
          <Space wrap>
            <Button onClick={() => loadExample('sentiment')}>
              Sentiment Example
            </Button>
            <Button onClick={() => loadExample('classification')}>
              Classification Example
            </Button>
            <Button onClick={() => loadExample('entity')}>
              Entity Example
            </Button>
          </Space>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Labeling Instructions: <span style={{ color: 'red' }}>*</span>
          </label>
          <TextArea
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            placeholder="Describe how to label your data...

Example:
Classify each review as:
- 'positive' if customer is satisfied
- 'negative' if customer is disappointed  
- 'neutral' if neither positive nor negative"
            rows={10}
            style={{ fontFamily: 'monospace' }}
          />
          <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
            {schema.length} characters (minimum 20 recommended)
          </div>
        </div>

        {schema && (
          <Alert
            message="Preview: What AI Will See"
            description={
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                fontSize: '12px' 
              }}>
                {schema}
              </pre>
            }
            type="success"
          />
        )}

        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleConfigure}
          loading={loading}
          disabled={!schema.trim()}
          block
        >
          {loading ? 'Configuring...' : 'Configure & Continue'}
        </Button>
      </Space>
    </Card>
  );
}

export default SchemaInput;