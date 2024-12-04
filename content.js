async function getAccessToken() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getAccessToken" });
    if (response.error) {
      throw new Error(response.error);
    }
    return response.accessToken;
  } catch (error) {
    console.error('获取access token错误:', error);
    throw error;
  }
}

async function askBaidu(content) {
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: "askBaidu", 
      content: content 
    });
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  } catch (error) {
    console.error('调用百度API错误:', error);
    throw error;
  }
}

function createToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'ai-toast';
  toast.textContent = message;
  if (isError) {
    toast.classList.add('error');
  }
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function createCard(selectedText) {
  const card = document.createElement('div');
  card.className = 'ai-card';
  
  const pageTitle = document.title;
  
  card.innerHTML = `
    <div class="card-title">${pageTitle}</div>
    <div class="card-content">
      <div class="selected-content">${selectedText}</div>
      <textarea class="question-input" placeholder="Enter your question..."></textarea>
      <div class="card-footer">
        <select class="options-select">
          <option value="option1" selected>Summarize and explain key points</option>
          <option value="option2">Detailed explanation and related knowledge</option>
        </select>
        <button class="save-button">Submit</button>
      </div>
    </div>
  `;

  document.body.appendChild(card);

  // 获取保存按钮和其他元素
  const saveButton = card.querySelector('.save-button');
  const optionsSelect = card.querySelector('.options-select');
  const questionInput = card.querySelector('.question-input');
  const contentDiv = card.querySelector('.card-content');

  // 保存按钮点击事件
  saveButton.addEventListener('click', async () => {
    try {
      saveButton.disabled = true;
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Processing...';
      
      const selectedOption = optionsSelect.value;
      const questionText = questionInput.value.trim();
      
      let content = selectedText + '\n';
      
      if (questionText) {
        content += `Thoughts: ${questionText}\n`;
      }
      
      if (selectedOption === 'option1') {
        content += 'Please summarize and explain the key points in this text in English';
      } else {
        content += 'Please provide a detailed explanation of this topic and share any related knowledge that would be valuable to know in English';
      }

      console.log('Sending content:', content);
      const response = await askBaidu(content);
      console.log('收到响应:', response);

      if (response && response.result) {
        // 先恢复按钮状态
        saveButton.disabled = false;
        saveButton.textContent = originalText;
        
        // 然后更新内容
        contentDiv.innerHTML += `
          <hr class="ai-divider">
          <div class="ai-response">${response.result}</div>
        `;
      } else {
        console.error('无效的响应数据:', response);
        throw new Error('返回数据格式错误');
      }
      
    } catch (error) {
      console.error('处理失败:', error);
      let errorMessage = '保存失败，请稍后再试';
      
      if (error.message === 'API密钥未配置') {
        errorMessage = '请先在选项页面配置API密钥';
      } else if (error.message.includes('access token')) {
        errorMessage = 'API密钥无效，请检查配置';
      }
      
      createToast(errorMessage, true);
      
      // 恢复按钮状态
      saveButton.disabled = false;
      saveButton.textContent = '保存';
    }
  });

  // 防止点击卡片内部关闭卡片
  card.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 点击卡片外部关闭卡片
  document.addEventListener('click', (e) => {
    if (!card.contains(e.target)) {
      card.remove();
    }
  });

  // 防止滚动穿透
  card.addEventListener('wheel', (e) => {
    e.stopPropagation();
  });
}

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showCard") {
    createCard(request.selectedText);
  }
}); 