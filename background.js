chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askAI",
    title: "Ask AI Assistant",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askAI") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0].status === "complete") {
        chrome.tabs.sendMessage(tab.id, {
          action: "showCard",
          selectedText: info.selectionText
          
        }, (response) => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }, () => {
              chrome.tabs.sendMessage(tab.id, {
                action: "showCard",
                selectedText: info.selectionText
              });
            });
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  if (request.action === "getAccessToken") {
    handleGetAccessToken()
      .then(result => {
        console.log('Get token successfully:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Failed to get token:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
  
  if (request.action === "askBaidu") {
    handleAskBaidu(request.content)
      .then(result => {
        console.log('API call successful:', result);
        sendResponse({ result: result.result });
      })
      .catch(error => {
        console.error('API call failed:', error);
        sendResponse({ 
          error: error.message,
          details: error.response || 'No detailed error information obtained'
        });
      });
    return true;
  }
});

async function handleGetAccessToken() {
  try {
    let { deepaiApiKey, deepaiSecretKey } = await chrome.storage.sync.get(['deepaiApiKey', 'deepaiSecretKey']);
    
    if (!deepaiApiKey || !deepaiSecretKey) {
      deepaiApiKey = "sHKH677D5uO4Q6vTVlTAMZti";
      deepaiSecretKey = "DjRuUDu5z51VcxkhLf6iJBfJmK2h5ddq";
    }

    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${deepaiApiKey}&client_secret=${deepaiSecretKey}`;
    
    console.log('Requesting access token...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token response error:', response.status, errorData);
      throw new Error(`Failed to get access token: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Token response:', data);

    if (!data.access_token) {
      throw new Error('Invalid access token response');
    }

    return { accessToken: data.access_token };
  } catch (error) {
    console.error('Token error:', error);
    throw error;
  }
}

async function handleAskBaidu(content) {
  try {
    const { accessToken } = await handleGetAccessToken();
    const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed?access_token=${accessToken}`;
    
    console.log('Sending request to Baidu API:', content);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: content
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API response error:', response.status, errorData);
      throw new Error(`API request failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('API response data:', data);

    if (!data || !data.result) {
      throw new Error('Invalid API response format: missing result field');
    }

    return { result: data.result };
  } catch (error) {
    console.error('handleAskBaidu error:', error);
    throw error;
  }
} 