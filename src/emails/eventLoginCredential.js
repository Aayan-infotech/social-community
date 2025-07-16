function sendEventLoginCredentialEmail(username, password) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to [Platform Name] - Your Login Details</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .email-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            max-width: 600px;
            width: 100%;
            position: relative;
        }
        
        .email-header {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
        }
        
        .email-header::before {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 0;
            right: 0;
            height: 20px;
            background: radial-gradient(circle at 10px 10px, transparent 10px, white 10px);
            background-size: 20px 20px;
        }
        
        .welcome-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .welcome-subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        
        .platform-name {
            font-size: 14px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .email-body {
            padding: 40px 30px;
            background: white;
        }
        
        .credentials-section {
            background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e1f5fe;
        }
        
        .credentials-title {
            font-size: 20px;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
            font-weight: bold;
        }
        
        .credentials-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .credential-item {
            padding: 20px;
            background: white;
            border-radius: 10px;
            border-left: 4px solid #4facfe;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .credential-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .credential-value {
            font-size: 16px;
            color: #333;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            word-break: break-all;
        }
        
        .login-button {
            text-align: center;
            margin: 20px 0;
        }
        
        .login-btn {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
        }
        
        .security-alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        
        .security-icon {
            font-size: 20px;
            margin-right: 10px;
        }
        
        .security-text {
            color: #856404;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .steps-section {
            background: #f8f9ff;
            border-radius: 10px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .steps-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
        }
        
        .steps-list {
            list-style: none;
            counter-reset: step-counter;
        }
        
        .steps-list li {
            counter-increment: step-counter;
            margin-bottom: 10px;
            padding-left: 40px;
            position: relative;
            color: #555;
            line-height: 1.5;
        }
        
        .steps-list li::before {
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            background: #4facfe;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }
        
        .email-footer {
            background: #f8f9ff;
            padding: 30px;
            text-align: center;
            border-top: 2px dashed #ddd;
        }
        
        .support-info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .support-contact {
            color: #4facfe;
            text-decoration: none;
            font-weight: bold;
        }
        
        .footer-note {
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        @media (max-width: 600px) {
            .credentials-info {
                grid-template-columns: 1fr;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .email-body {
                padding: 30px 20px;
            }
            
            .welcome-title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1 class="welcome-title">Welcome!</h1>
            <p class="welcome-subtitle">Your account is ready to use</p>
            <p class="platform-name">Social Community</p>
        </div>
        
        <div class="email-body">
            <div class="credentials-section">
                <h2 class="credentials-title">🔑 Your Login Details</h2>
                <div class="credentials-info">
                    <div class="credential-item">
                        <div class="credential-label">Username</div>
                        <div class="credential-value">${username}</div>
                    </div>
                    <div class="credential-item">
                        <div class="credential-label">Temporary Password</div>
                        <div class="credential-value">${password}</div>
                    </div>
                </div>
            </div>
            
          
        
        <div class="email-footer">
            <div class="footer-note">
                <p><strong>Security Notice:</strong> This email contains sensitive information. Please delete it after successfully logging in and changing your password.</p>
                <p>© 2025 Social Community. All rights reserved. | <a href="#" style="color: #999;">Privacy Policy</a></p>
            </div>
        </div>
    </div>
</body>
</html>`;
}
export { sendEventLoginCredentialEmail };