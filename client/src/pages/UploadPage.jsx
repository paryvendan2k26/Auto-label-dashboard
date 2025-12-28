import Upload from '../components/Upload';
import SchemaInput from '../components/SchemaInput';
import Progress from '../components/Progress';
import { useState } from 'react';
import { Card, Steps } from 'antd';
import { useNavigate } from 'react-router-dom';

function UploadPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [datasetId, setDatasetId] = useState(null);
  const navigate = useNavigate();

  const handleUploadSuccess = (data) => {
    setDatasetId(data.datasetId);
    setCurrentStep(1);
  };

  const handleConfigureSuccess = async (data) => {
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
    // Redirect to dataset detail page
    navigate(`/dataset/${datasetId}`);
  };

  const steps = [
    { title: 'Upload', description: 'Upload your dataset' },
    { title: 'Configure', description: 'Define labeling schema' },
    { title: 'Label', description: 'AI labels your data' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </Card>

      {currentStep === 0 && (
        <Upload onUploadSuccess={handleUploadSuccess} />
      )}

      {currentStep === 1 && datasetId && (
        <SchemaInput 
          datasetId={datasetId} 
          onConfigureSuccess={handleConfigureSuccess}
        />
      )}

      {currentStep === 2 && datasetId && (
        <Progress 
          datasetId={datasetId}
          onComplete={handleLabelingComplete}
        />
      )}
    </div>
  );
}

export default UploadPage;