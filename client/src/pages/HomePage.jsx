import { Card, Typography, Row, Col, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { 
  RocketOutlined, 
  CheckCircleOutlined, 
  ThunderboltOutlined, 
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function HomePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Section */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)',
          border: 'none',
          textAlign: 'center',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={1} style={{ margin: 0, color: '#13c2c2' }}>
            Automated Data Labeling Dashboard
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#595959', maxWidth: 800, margin: '0 auto' }}>
            Transform your raw data into labeled datasets using AI-powered automation. 
            Save time, reduce costs, and improve accuracy with smart labeling technology.
          </Paragraph>
          <Link to="/upload">
            <Button type="primary" size="large" icon={<RocketOutlined />}>
              Get Started
            </Button>
          </Link>
        </Space>
      </Card>

      {/* Features Section */}
      <Title level={2} style={{ marginBottom: 24 }}>
        Features
      </Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size="middle">
              <UploadOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <Title level={4}>Easy Upload</Title>
              <Paragraph style={{ color: '#595959' }}>
                Upload CSV or JSON files with drag-and-drop interface. 
                Support for datasets up to 10MB.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size="middle">
              <ThunderboltOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <Title level={4}>AI-Powered Labeling</Title>
              <Paragraph style={{ color: '#595959' }}>
                Automatically label your data using advanced AI. 
                Define custom schemas for any labeling task.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size="middle">
              <CheckCircleOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <Title level={4}>Smart Review</Title>
              <Paragraph style={{ color: '#595959' }}>
                Intelligent queue prioritizes uncertain items. 
                Review only what needs human attention.
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* How It Works */}
      <Title level={2} style={{ marginBottom: 24 }}>
        How It Works
      </Title>

      <Card style={{ marginBottom: 48 }}>
        <Row gutter={[48, 24]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ color: '#13c2c2' }}>
                  1. Upload Your Data
                </Title>
                <Paragraph style={{ color: '#595959' }}>
                  Upload CSV or JSON files containing your unlabeled data. 
                  The system automatically parses and validates your dataset.
                </Paragraph>
              </div>

              <div>
                <Title level={4} style={{ color: '#13c2c2' }}>
                  2. Define Labels
                </Title>
                <Paragraph style={{ color: '#595959' }}>
                  Provide clear labeling instructions. Define categories, 
                  sentiment types, or custom classification schemas.
                </Paragraph>
              </div>

              <div>
                <Title level={4} style={{ color: '#13c2c2' }}>
                  3. AI Labels Automatically
                </Title>
                <Paragraph style={{ color: '#595959' }}>
                  Our AI processes your data and assigns labels with confidence scores. 
                  Track progress in real-time.
                </Paragraph>
              </div>

              <div>
                <Title level={4} style={{ color: '#13c2c2' }}>
                  4. Review & Export
                </Title>
                <Paragraph style={{ color: '#595959' }}>
                  Review uncertain labels using our smart queue. 
                  Export your fully labeled dataset as CSV.
                </Paragraph>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={12}>
            {/* Placeholder for screenshot/demo video */}
            <div
              style={{
                height: 400,
                background: '#f0fdfd',
                border: '2px dashed #b5f5ec',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <DownloadOutlined style={{ fontSize: 48, color: '#b5f5ec' }} />
              <Paragraph style={{ color: '#8c8c8c', margin: 0 }}>
                Demo Video / Screenshot
              </Paragraph>
              <Paragraph style={{ color: '#8c8c8c', fontSize: 12, margin: 0 }}>
                Add your demo video or application screenshot here
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Benefits */}
      <Title level={2} style={{ marginBottom: 24 }}>
        Benefits
      </Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        <Col xs={24} md={12}>
          <Card>
            <Title level={4}>Save Time</Title>
            <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
              Reduce labeling time by up to 85%. What takes days manually 
              can be completed in minutes with AI assistance.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Title level={4}>Reduce Costs</Title>
            <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
              Lower operational costs significantly. AI labeling costs 
              ~$0.001 per item vs $0.50 for manual labeling.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Title level={4}>Improve Accuracy</Title>
            <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
              Consistent labeling with confidence scores. Focus human 
              attention on uncertain cases for optimal accuracy.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Title level={4}>Scale Easily</Title>
            <Paragraph style={{ color: '#595959', marginBottom: 0 }}>
              Handle datasets of any size. From hundreds to millions 
              of items with adaptive batch processing.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Card
        style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)',
          border: 'none',
        }}
      >
        <Space direction="vertical" size="large">
          <Title level={3} style={{ color: '#13c2c2', margin: 0 }}>
            Ready to get started?
          </Title>
          <Paragraph style={{ fontSize: 16, color: '#595959', margin: 0 }}>
            Upload your first dataset and experience AI-powered labeling
          </Paragraph>
          <Link to="/upload">
            <Button type="primary" size="large">
              Upload Dataset
            </Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}

export default HomePage;