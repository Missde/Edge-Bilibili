
chrome.action.onClicked.addListener(function(tab){
     chrome.tabs.create({ url: 'index.html' });
});


//消息中转站
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.connect=="backgroundJS"){
		if (request.oneWinfullscreen) {
			//将oneWin聚焦
			chrome.windows.update(request.oneWinfullscreen-0, { focused: true });
		}else if (request.icons) {
			//更改自定义的icon
			chrome.action.setIcon({path: {"128":"/pic/"+request.icons+".png"}});
		}
		sendResponse({ success: true});
	}
	return true;
});


/*
chrome.windows.onRemoved.addListener(function(windowId) {
  // windowId 为被关闭窗口的 ID
  console.log("The window " + windowId + " is closed.");
});
*/




















