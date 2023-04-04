function cache(pre){
	var root=this;
	if(typeof pre!="string")pre="";
	this.set=function(key,value){
		if(typeof(value)==="object")value=JSON.stringify(value);
		localStorage[pre+key] = value
	}
	this.get=function(key,type){
		var value=localStorage[pre+key];
		if(type){
			try{
				value=JSON.parse(value);
				if(type=="array" && !Array.isArray(value))value="";
				else if(type=="json" && Array.isArray(value))value="";
			}catch(e){
				if(type)value="";
			}
			if(!value && type=="json")return {}
			else if(!value && type=="array")return [];
		}
		if(typeof value=='undefined')value='';
		return value;
	}
	this.remove=function(key){localStorage.removeItem(pre+key)}
	this.clear=function(){localStorage.clear()}
}
function formatTime(time,jian){
	if(!time)return;
	var fen='';
	if(time<60)return time+'秒';
	if(time>=86400){
		var d=parseInt(time/86400)
		if(d>2)return d+'天前';
		else if(d==2)return '前天';
		else return '昨天';
	}
	if(time>3600){
		fen=parseInt(time/3600)+'时';
		if(jian)return fen+"前";
		time=time%3600;
	}
	if(time>=60){
		fen+=parseInt(time/60)+'分';
		if(time%60)fen+=time%60+"秒";
	}
	return fen;
}
function cdate(time){
	return formatTime(Date.parse(new Date())/1000-time,1);

	var date=new Date(time*1000);
	var Y = date.getFullYear() + '-';
	var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
	var D = (date.getDate() < 10 ? '0'+(date.getDate()) : date.getDate()) + ' ';
	return Y+M+D;
}
function https(href){
	return 'https://'+href.replace("http://",'').replace("https://",'').replace("//","");
}
function wan(num){
	if(num>10000)num=(num/10000).toFixed(1)+"万";
	return num;
}

function post(url,data,callback,error){
	var load=layer.load();
	$.ajax({
		type:'POST',xhrFields: {withCredentials: true},
		url:url,data:data,
		dataType:'json',
		contentType:'application/x-www-form-urlencoded',
		success:function(db){
			layer.close(load);
			callback(db);
		},
		error:function(e){
			layer.close(load);
			if(typeof error=="function")error(e);
			else layer.msg("未能打开网址");
		}
	});
}

function get(url,callback,error){
	var load=layer.load();
	var json={};
	var async=typeof callback=="function";



	$.ajax({
		type:'GET',async:async,
		url:url,
		contentType:'application/json',
		success:function(db){
			layer.close(load);
			if(async)callback(db);
			json=db;
		},
		error:function(e){
			layer.close(load);
			if(bili && bili.playerWindow){
				var tishi=bili.playerWindow.document.getElementsByClassName("tishi")[0];
				tishi.innerHTML="未能打开网址";
				tishi.style.display="block";
			}else{
				if(typeof error=="function")error(e);
				else layer.msg("未能打开网址");
			}
		}
	});
	if(!async)return json;
}
function leadingIn(file){
	const reader = new FileReader();
	reader.readAsText(file);
	reader.onload = () => {
		try{
			localStorage.clear();//清除旧数据
			var json=JSON.parse(reader.result);
			for(var key in json){
				if(key.indexOf("_")==-1)continue;
				var value=json[key];
				if(typeof(value)==="object")value=JSON.stringify(value);
				localStorage[key] = value;
			}

			layer.msg("导入完毕");
			location.reload();
		}catch(e){
			layer.msg("导入错误");
		}
	};
}
function leadingOut(){
	var json={}
	for(var i in localStorage){
		try{
			json[i]=JSON.parse(localStorage[i]);
		}catch(e){
			json[i]=localStorage[i];
		}
	}
	var stringData = JSON.stringify(json);
	//var blob = new Blob([stringData], {type: "text/plain;charset=utf-8"});
	var blob = new Blob([stringData], {type: 'application/json'})

	var objectURL = URL.createObjectURL(blob)

	var aTag = document.createElement('a')
	aTag.href = objectURL
	aTag.download = "个性设置.json"
	aTag.click()
	layer.msg("已导出全部配置");
}


function oneWin(url,width,height,xianshiqi){
	if(!url){
		var windowId=localStorage["oneWinId"]-0
		if(!(windowId>0))return;
		chrome.windows.get(windowId, function(win) {
			if(!win)return localStorage["oneWinId"]=0;
			var config={focused:true};
			if (win.state === "minimized" || width)config.state='normal';//恢复窗口状态
			if(width){
				if(width=='max')config.state='maximized';
				else{
					config.width=parseInt(width);
					config.height=parseInt(height);
				}
			}
			chrome.windows.update(windowId,config);
		});
		return;
	}

	chrome.windows.getAll({populate: true},function(wins) {
		var find=false;
		for (var i = 0; i < wins.length; i++) {
			if (wins[i].id == localStorage["oneWinId"]) {
				find=wins[i].tabs[0].id;
				break;
			}
		}
		//------------

		width=width||630;
		height=height||400;

		var config={focused:true}
		if(width=='max'){
			config.state='maximized';
		}else if(width=='full'){
			config.state="fullscreen";
		}else{
			config.state="normal";
		}

		if(find){
			//不改变窗口大小
			chrome.tabs.update(find,{ url: url});
			chrome.windows.update(localStorage["oneWinId"]-0,config);

		}else{
			config.width=parseInt(width);
			config.height=parseInt(height);
			config.url=url;
			config.type='popup';

			chrome.system.display.getInfo(function(displays) {
				if(displays.length>1){
					if(xianshiqi>=displays.length)xianshiqi=displays.length-1;
					display=displays[xianshiqi];
					config.left=display.bounds.left;
					config.top=display.bounds.top;
				}
				chrome.windows.create(config, function(win) {
					localStorage["oneWinId"]=win.id
				});
			});
		}
	});
}

var sendMessage={
	backgroundJS:"backgroundJS",
	biliIndex:'biliIndex',vTime:'vTime',HTML:'html',
	biliPlayer:'biliPlayer',playbvid:'playbvid',reload:'reload',URL:'url',
};

jQuery(document).ready(function(){
	//按键激活窗口
	document.addEventListener('keydown',function(event){
		if (document.activeElement.tagName.toLowerCase() === 'input' || document.activeElement.tagName.toLowerCase()=="textarea")return;
		if(event.ctrlKey || event.shiftKey || event.altKey)return;
		if (event.keyCode == 70 || event.key === "F11" ||
			event.keyCode == 37 || event.keyCode == 39 ||
			event.keyCode == 38 || event.keyCode == 40 ||
			event.keyCode == 32
			){
			chrome.runtime.sendMessage({connect:sendMessage.backgroundJS,oneWinfullscreen:localStorage["oneWinId"]-0});
		}
	});



})
