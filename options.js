document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const secretKeyInput = document.getElementById('secretKey');
  const toggleBtn = document.getElementById('toggleVisibility');
  const toggleSecretBtn = document.getElementById('toggleSecretVisibility');
  const saveBtn = document.getElementById('saveBtn');
  const toast = document.getElementById('toast');
  const eyeIcon = document.getElementById('eyeIcon');
  const secretEyeIcon = document.getElementById('secretEyeIcon');

  // 加载保存的密钥
  chrome.storage.sync.get(['deepaiApiKey', 'deepaiSecretKey'], (result) => {
    if (result.deepaiApiKey) {
      apiKeyInput.value = result.deepaiApiKey;
    }
    if (result.deepaiSecretKey) {
      secretKeyInput.value = result.deepaiSecretKey;
    }
  });

  // 切换API Key可见性
  toggleBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      eyeIcon.style.opacity = '1';
    } else {
      apiKeyInput.type = 'password';
      eyeIcon.style.opacity = '0.6';
    }
  });

  // 切换Secret Key可见性
  toggleSecretBtn.addEventListener('click', () => {
    if (secretKeyInput.type === 'password') {
      secretKeyInput.type = 'text';
      secretEyeIcon.style.opacity = '1';
    } else {
      secretKeyInput.type = 'password';
      secretEyeIcon.style.opacity = '0.6';
    }
  });

  // 保存密钥
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const secretKey = secretKeyInput.value.trim();
    
    chrome.storage.sync.set({
      deepaiApiKey: apiKey,
      deepaiSecretKey: secretKey
    }, () => {
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 2000);
    });
  });
}); 