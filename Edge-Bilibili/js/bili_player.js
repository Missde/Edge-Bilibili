jQuery(document).ready(function(){
	const bili = /\/(mp4|zan|fav|toubi)\/(.*)\/$/.exec(location.href);

	if (bili){
		if(bili[1]=='zan')biliZan(bili[2]);
		else if(bili[1]=='toubi')biliToubi(bili[2]);
		else if(bili[1]=='fav')biliFav(bili[2]);
		else if(bili[1]=='mp4')biliMp4(bili[2]);
	}else{
		$("body").html(location.href);
	}

})

function msg(type,config){
	if(!type)return;
	if(!config)config={};
	config.type=type;
	parent.postMessage(config, '*');
}


var vtimeT=0;
function biliZan(config){
	$("body").html($("正在点赞"));
	config=config.split('_');

	var post={
		'like':config[0],
		'aid':config[1],
		'csrf':config[2],
		'eab_x':'2',
		'ramval':'9',
		'source':'web_normal',
		'ga':'1'
	}

	$.ajax({
		url: "https://api.bilibili.com/x/web-interface/archive/like",
		type: "POST",xhrFields: {withCredentials: true},
		data: post,
		success: function(re) {
			msg('dianzan',{ok:!re.code,msg:re.message,like:post.like,re:re})
		},
		error: function(jqXHR, textStatus, errorThrown) {
			msg('dianzan',{ok:false,msg:errorThrown});
		}
	});

}
function biliToubi(config){
	$("body").html($("正在投币"));
	config=config.split('_');
	var post={
		'btype':config[0],//投几个币
		'aid':config[1],//
		'csrf':config[2],
		"multiply":1,
		"select_like":1,//不勾选点赞
		"cross_domain":true,
		"eab_x":2,
		"ramval":0,
		"source":"web_normal",
		"ga":1
	}
	$.ajax({
		url: "https://api.bilibili.com/x/web-interface/coin/add",
		type: "POST",xhrFields: {withCredentials: true},
		data: post,
		success: function(re) {
			msg('toubi',{ok:!re.code,msg:re.message,toubi:post.btype,re:re})
		},
		error: function(jqXHR, textStatus, errorThrown) {
			msg('toubi',{ok:false,msg:errorThrown});
		}
	});
}

function biliFav(config){
	$("body").html($("正在收藏"));
	config=config.split('_');
	var post={
		'rid':config[1],
		'type':2,
		'add_media_ids':(config[0]!=2?config[2]:""),//添加到收藏夹
		'del_media_ids':(config[0]==2?config[2]:""),//删除
		'jsonp':'jsonp',
		'csrf':config[3],
		'platform':'web',
		'eab_x':2,
		'ramval':6,
		'gaia_source':'web_normal',
		'ga':1
	}
	$.ajax({
		url: "https://api.bilibili.com/x/v3/fav/resource/deal",
		type: "POST",xhrFields: {withCredentials: true},
		data: post,
		success: function(re) {
			msg('fav',{ok:!re.code,msg:re.message,rid:post.rid,re:re})
		},
		error: function(jqXHR, textStatus, errorThrown) {
			msg('fav',{ok:false,msg:errorThrown});
		}
	});

}
function biliMp4(mp4){
	mp4=mp4.split("___");
	var style = document.createElement('style');
	style.type = 'text/css';
	var rule = document.createTextNode('video:focus {outline: -webkit-focus-ring-color auto 0px;} video::-webkit-media-controls-fullscreen-button {display: none !important;}');
	style.appendChild(rule);
	document.head.appendChild(style);

	$("html,body").css({background:"#000",width:"100%",height:"100%",padding:0,margin:0,overflow:"hidden"})
	$("body").html('<video id="biliplayer" src="'+decodeURIComponent(mp4[0])+'" controls="controls" autoplay="1" style="width:auto;height:100%;display:block;margin:0 auto;" disablepictureinpicture=""></video>');

	var video=$("#biliplayer")[0];
	video.addEventListener('loadedmetadata', function(e) {
		msg('resizeIframe',{w:video.videoWidth,h:video.videoHeight,vlong:video.duration});
		video.volume =mp4[1]||0.7;
		video.currentTime=mp4[2]||0;
	})

	video.addEventListener('ended', function(e) {
		msg("ended",{vtime:video.currentTime,vlong:video.duration});
	})

	video.addEventListener('pause', function(e) {
		msg("pause",{vtime:video.currentTime,vlong:video.duration});
	})
	video.addEventListener('play', function(e) {
		msg("play");
	})
	video.addEventListener('error', function(e) {
		msg("error");
	})

	video.ontimeupdate=function(){
		//1.5秒记录1次
		if(!((video.currentTime-vtimeT)>1.5))return;
		vtimeT=video.currentTime;
		msg('currentTime',{vtime:video.currentTime,vlong:video.duration})
	}
	$("video").click(function(){
		if(this.paused)this.play();
		else this.pause();
	})


}




window.addEventListener('message', player => {
	player=player.data;
	console.log("player",player);
	if(player.act=="play"){
		var video=$("#biliplayer")[0];
		video.currentTime =0;
		video.play();
	}
});

document.addEventListener('keydown',function(event){
	if (document.activeElement.tagName.toLowerCase() === 'input' || document.activeElement.tagName.toLowerCase()=="textarea")return;
	if(event.ctrlKey || event.shiftKey || event.altKey)return;

	if (event.keyCode == 70)return msg("fullscreen");;

});


