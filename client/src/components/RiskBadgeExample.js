import React from 'react';
import RiskBadge from './RiskBadge';

/**
 * Example component demonstrating RiskBadge usage
 * This can be used for testing and documentation purposes
 */
const RiskBadgeExample = () => {
  return (
    <div className="risk-badge-example" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>RiskBadge Component Examples</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Basic Usage</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <RiskBadge riskLevel="low" />
          <RiskBadge riskLevel="medium" />
          <RiskBadge riskLevel="high" />
          <RiskBadge riskLevel="critical" />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Different Sizes</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span>Small:</span>
          <RiskBadge riskLevel="high" size="sm" />
          <span>Medium:</span>
          <RiskBadge riskLevel="high" size="md" />
          <span>Large:</span>
          <RiskBadge riskLevel="high" size="lg" />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Without Icons</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <RiskBadge riskLevel="critical" showIcon={false} />
          <RiskBadge riskLevel="high" showIcon={false} />
          <RiskBadge riskLevel="medium" showIcon={false} />
          <RiskBadge riskLevel="low" showIcon={false} />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Custom Styling</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <RiskBadge riskLevel="critical" className="risk-badge-compact" />
          <RiskBadge riskLevel="high" className="risk-badge-inline" />
          <RiskBadge riskLevel="medium" className="risk-badge-status" />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>In Context (Table-like)</h3>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '10px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div style={{ fontWeight: 'bold' }}>Event</div>
            <div style={{ fontWeight: 'bold' }}>Risk Level</div>
            <div style={{ fontWeight: 'bold' }}>Status</div>
            
            <div>Login Attempt</div>
            <div><RiskBadge riskLevel="low" size="sm" /></div>
            <div>Success</div>
            
            <div>Failed Login</div>
            <div><RiskBadge riskLevel="medium" size="sm" /></div>
            <div>Failed</div>
            
            <div>Suspicious Activity</div>
            <div><RiskBadge riskLevel="high" size="sm" /></div>
            <div>Alert</div>
            
            <div>Security Breach</div>
            <div><RiskBadge riskLevel="critical" size="sm" /></div>
            <div>Critical</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Code Examples</h3>
        <div style={{ 
          backgroundColor: '#1f2937', 
          color: '#f9fafb', 
          padding: '15px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <div>// Basic usage</div>
          <div>&lt;RiskBadge riskLevel="high" /&gt;</div>
          <br />
          <div>// With custom size</div>
          <div>&lt;RiskBadge riskLevel="critical" size="lg" /&gt;</div>
          <br />
          <div>// Without icon</div>
          <div>&lt;RiskBadge riskLevel="medium" showIcon={false} /&gt;</div>
          <br />
          <div>// In table cell</div>
          <div>&lt;td className="risk-cell"&gt;</div>
          <div>&nbsp;&nbsp;&lt;RiskBadge riskLevel={log.riskLevel || 'low'} size="sm" /&gt;</div>
          <div>&lt;/td&gt;</div>
        </div>
      </div>
    </div>
  );
};

export default RiskBadgeExample; 