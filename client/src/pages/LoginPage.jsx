import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values.email, values.password);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #E8F5F1 0%, #F4FAF8 100%)',
      padding: '24px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 8px 32px rgba(0, 104, 74, 0.15)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }} align="center">
          <div style={{ textAlign: 'center' }}>
            <LoginOutlined style={{ fontSize: 48, color: '#00684A', marginBottom: 16 }} />
            <Title level={2} style={{ margin: 0, color: '#001E2B' }}>
              Welcome Back
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Sign in to your account
            </Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            style={{ width: '100%' }}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 48, fontSize: 16, fontWeight: 600 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#00684A', fontWeight: 600 }}>
                Sign up
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default LoginPage;

