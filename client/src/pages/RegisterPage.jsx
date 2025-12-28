import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const result = await register(values.name, values.email, values.password);
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
            <UserAddOutlined style={{ fontSize: 48, color: '#00684A', marginBottom: 16 }} />
            <Title level={2} style={{ margin: 0, color: '#001E2B' }}>
              Create Account
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Sign up to get started
            </Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            style={{ width: '100%' }}
            size="large"
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Full Name"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
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
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#00684A', fontWeight: 600 }}>
                Sign in
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default RegisterPage;

