<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    function goHome() {
      goto('/');
    }
    
    function reload() {
      window.location.reload();
    }
  </script>
  
  <div class="error-container">
    <div class="error-content">
      <div class="error-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      
      <h1>Oops! Something went wrong</h1>
      
      <div class="error-details">
        <p class="error-status">Error {$page.status}</p>
        <p class="error-message">{$page.error?.message || 'An unexpected error occurred'}</p>
      </div>
      
      <div class="error-actions">
        <button class="btn btn-primary" on:click={reload}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"></polyline>
            <path d="M20.49,15a9,9 0 1,1-2.12-9.36L23,10"></path>
          </svg>
          Try Again
        </button>
        
        <button class="btn btn-secondary" on:click={goHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3,9l9-7l9,7v11a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
          Go Home
        </button>
      </div>
    </div>
  </div>
  
  <style>
    .error-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .error-content {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
    }
    
    .error-icon {
      color: #e74c3c;
      margin-bottom: 24px;
    }
    
    .error-content h1 {
      margin: 0 0 24px 0;
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 600;
    }
    
    .error-details {
      margin-bottom: 32px;
    }
    
    .error-status {
      margin: 0 0 8px 0;
      color: #e74c3c;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .error-message {
      margin: 0;
      color: #7f8c8d;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background: #3498db;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2980b9;
      transform: translateY(-2px);
    }
    
    .btn-secondary {
      background: #95a5a6;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #7f8c8d;
      transform: translateY(-2px);
    }
    
    @media (max-width: 480px) {
      .error-content {
        padding: 32px 24px;
      }
      
      .error-actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  </style>