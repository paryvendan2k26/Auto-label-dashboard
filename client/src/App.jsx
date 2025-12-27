import { useState } from 'react';
import { Layout, Steps, Card, Button, Typography, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Upload from './components/Upload';
import SchemaInput from './components/SchemaInput';
import Progress from './components/Progress';
import Statistics from './components/Statistics';
import ReviewQueue from './components/ReviewQueue';
import Export from './components/Export';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [datasetId, setDatasetId] = useState(null);
  const [datasetName, setDatasetName] = useState('');

  const handleUploadSuccess = (data) => {
    console.log('Upload successful:', data);
    setDatasetId(data.datasetId);
    setDatasetName(data.name);
    setCurrentStep(1);
  };

  const handleConfigureSuccess = async (data) => {
    console.log('Configure successful:', data);
    
    // Start labeling
    try {
      await fetch(`/api/labels/dataset/${datasetId}/label`, {
        method: 'POST'
      });
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to start labeling:', error);
    }
  };

  const handleLabelingComplete = () => {
    console.log('Labeling complete!');
    setCurrentStep(3);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setDatasetId(null);
    setDatasetName('');
  };

  const steps = [
    {
      title: 'Upload',
      description: 'Upload your dataset',
    },
    {
      title: 'Configure',
      description: 'Define labeling schema',
    },
    {
      title: 'Label',
      description: 'AI labels your data',
    },
    {
      title: 'Review & Export',
      description: 'Review and download',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 50px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Title level={3} style={{ margin: '16px 0' }}>
           Automated Data Labeling Dashboard
        </Title>
        {currentStep > 0 && (
          <Button 
            icon={<HomeOutlined />}
            onClick={handleReset}
          >
            New Dataset
          </Button>
        )}
      </Header>

      <Content style={{ padding: '50px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          
          {/* Progress Steps */}
          <Card style={{ marginBottom: 24 }}>
            <Steps current={currentStep} items={steps} />
          </Card>

          {/* Step 0: Upload */}
          {currentStep === 0 && (
            <Upload onUploadSuccess={handleUploadSuccess} />
          )}

          {/* Step 1: Schema Configuration */}
          {currentStep === 1 && datasetId && (
            <SchemaInput 
              datasetId={datasetId} 
              onConfigureSuccess={handleConfigureSuccess}
            />
          )}

          {/* Step 2: Progress Tracking */}
          {currentStep === 2 && datasetId && (
            <Progress 
              datasetId={datasetId}
              onComplete={handleLabelingComplete}
            />
          )}

          {/* Step 3: Review & Export */}
          {currentStep === 3 && datasetId && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Statistics datasetId={datasetId} />
              <ReviewQueue datasetId={datasetId} />
              <Export datasetId={datasetId} datasetName={datasetName} />
            </Space>
          )}

        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        <Space direction="vertical">
          <div>
            <strong>Automated Labeling Dashboard</strong> © 2024
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Built with React + Ant Design + Express + MongoDB + OpenAI
          </div>
        </Space>
      </Footer>
    </Layout>
  );
}

export default App;