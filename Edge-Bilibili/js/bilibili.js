function bilibili(){
	var root=this;
	var C=new cache('bilibili_');
	var type=C.get("type","json");//观看的栏目
	var uper=C.get("uper","json");//观看的UP主
	var searchkey=C.get("searchkey",'array');
	var record=C.get("record",'array');//观看的视频全属性
	var playlis=C.get("playlis",'array');//加入到播放清单的
	var favlis=C.get("favlis",'array');//收藏的视频
	var viewlis=C.get("viewlis");//记录1000个观看视频bvid
	var zanlis=C.get("zanlis");//记录1000个点赞视频bvid
	var heilis=C.get("heilis","json");//记录1000个拉黑视频
	if(!heilis.title)heilis.title=[];
	if(!heilis.video)heilis.video="";
	if(!heilis.yin)heilis.yin={};
	var heilistitle=heilis.title.join(",");
	if(!heilis.style)heilis.style="fense";
	if(!heilis.winwidth)heilis.winwidth="720";
	if(!heilis.oldday)heilis.oldday=0;//设置X天内容为旧内容
	if(!heilis.newday)heilis.newday=0;//设置X天内容为新内容
	heilis.oldvideo=$.now()/1000-heilis.oldday*86400;
	heilis.newvideo=$.now()/1000-heilis.newday*86400+86400;


	var logo='pic/bilibili_'+heilis.style+'.svg';
	var URL={
		'islogin':"https://api.bilibili.com/x/web-interface/nav",
		'qrlogin':"https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=navUserCenterLogin",
		'qrlogincheck':"https://passport.bilibili.com/x/passport-login/web/qrcode/poll?source=navUserCenterLogin&qrcode_key=",
		'nav':'https://api.bilibili.com/x/web-interface/nav/stat',
		'follow':"https://api.bilibili.com/x/relation/stat?jsonp=jsonp&vmid=",
		"userinfo":"https://api.bilibili.com/x/space/upstat?jsonp=jsonp&mid=",
//		"search":'https://api.bilibili.com/x/web-interface/wbi/search/all/v2?page_size=50&search_type=video&keyword=',
		"search":'https://api.bilibili.com/x/web-interface/wbi/search/type?page_size=50&search_type=video&keyword=',

		"hot":'https://api.bilibili.com/x/web-interface/popular?ps=50&pn=',
		"xianguan":'https://api.bilibili.com/x/web-interface/view/detail?bvid=',
		"guanzhu":'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?timezone_offset=-480&type=all&offset=',
//		"suiji":'https://api.bilibili.com/x/web-interface/wbi/index/top/rcmd?fresh_type=3&version=1&ps=10&fresh_idx=1&fresh_idx_1h=1&homepage_ver=1&w_rid=c233643073c7472413de6c0cecc84be2&wts=1680492814&',
		"suiji":'https://api.bilibili.com/x/web-interface/index/top/rcmd?fresh_type=3&version=1&ps=10&wts=',
		"videoinfo":'https://api.bilibili.com/x/web-interface/view?bvid=',
		"videopage":'https://api.bilibili.com/x/player/playurl?otype=json&fnver=0&fnval=3&player=3&qn=64&platform=html5&high_quality=1&',
		"videopage2":'https://api.bilibili.com/pgc/player/web/playurl?',
//		"videopage2":'https://api.bilibili.com/x/player/playurl?',
		"iszan":'https://api.bilibili.com/x/web-interface/archive/relation?bvid=',
		"blacks":'https://api.bilibili.com/x/relation/blacks',
		//"kuayu":'https://www.bilibili.com/click/',
		"kuayu":'https://www.bilibili.com/blackboard/privacy-pc.html?/',
		'sms':'https://api.vc.bilibili.com/session_svr/v1/session_svr/single_unread?unread_type=0&build=0&mobi_app=web',
		'favlis':'https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=',
		'ping':'https://api.bilibili.com/x/v2/reply/main?mode=3&plat=1&seek_rpid=&type=1&oid=',
	}

	var favlis_={};
	for(var i in favlis)favlis_[favlis[i].bvid]=1;


	var recordJindu={}
	for(var i in record){
		if(record[i].vtime>0 && record[i].vlong>0)recordJindu[record[i].bvid]=(record[i].vtime/record[i].vlong*100).toFixed()+"%";
	}

	this.user={};
	//cookies的读取是异步的，可能后面获取不到
	chrome.cookies.getAll({domain:".bilibili.com"}, (cs) => {
		cs.map((c)=>{
			if(c.name=="DedeUserID")root.user.uid=c.value;
			else if(c.name=="bili_jct")root.user.csrf=c.value;
			else if(c.name=="SESSDATA")root.user.cookies="SESSDATA="+c.value;
		});
	})



	function jsonPage(css,json){
		var dd=$(".bili ."+css);
		if(!dd.hasClass("on"))return;
		var ul=dd.find("ul");
		var group=dd.find(".group div");
		var groupdiv=[[],[]];

		var page=ul.attr("page")>0?ul.attr("page"):1;
		if(!(ul.attr("page")>0)){
			$(window).scroll(function(){
				if($(this).scrollTop() + $(window).height()+200 >= $("body").height()){
					if(dd.hasClass("on")){
						lis(ul.attr("page")-0+1);
					}
				}
			});
			$(".bili .group b").click(function(){
				$(".bili .group .on").removeClass("on");
				ul.find("li").show();
			})
			$(".bili .group").on("click","a",function(){
				$(".bili .group .on").removeClass("on");
				$(this).addClass("on");
				var mid=$(this).attr("mid");
				var tid=$(this).attr("tid");
				if(mid>0 || tid>0){
					ul.find("li").hide();
					if(mid>0)ul.find("li[mid='"+mid+"']").show();
					else if(tid>0)ul.find("li[tid='"+tid+"']").show();
				}

			})
		}
		var page_;
		lis(page);

		function lis(page){
			if(page_==page || isNaN(page))return;
			page_=page;
			var limit=40;
			var a=(page-1)*limit;
			if(a>=json.length)return;
			ul.attr("page",page);
			var b=a+limit;
			for(var i in json){
				if(i<a || i>=b)continue;
				if(!json[i] || $('#'+css+'_'+json[i].bvid)[0])continue;

				var user=json[i].mid?(uper[json[i].mid]?uper[json[i].mid]:""):"";
				if(json[i].time>0)user+="("+cdate(json[i].time)+")";
				var time=json[i].vlong?formatTime(json[i].vlong):"";

				var l=recordJindu[json[i].bvid]?recordJindu[json[i].bvid]:0;

				var tid=json[i].tid||0;
				var mid=json[i].mid||0;
				if(group[0]){
					if(tid>0){
						var find = groupdiv[0].findIndex(obj => obj.tid === tid);
						if(find>-1)groupdiv[0][find].num+=1;
						else groupdiv[0].push({tid:tid,name:type[tid],num:1})
					}
					if(mid>0){
						var find = groupdiv[1].findIndex(obj => obj.mid === mid);
						if(find>-1)groupdiv[1][find].num+=1;
						else groupdiv[1].push({mid:mid,name:uper[mid],num:1})
					}
				}

				var li='<li tid="'+tid+'" mid="'+mid+'" id="'+css+'_'+json[i].bvid+'"><a href="https://www.bilibili.com/video/'+json[i].bvid+'" target="kanbili" tit="'+json[i].title+'" bvid="'+json[i].bvid+'" cid="'+json[i].cid+'"  aid="'+json[i].aid+'">\
				'+pic(json[i].img)+'\
				<p>'+user+'</p>\
				<b>'+json[i].title+'<i style="width:'+l+'"></i></b></a>\
				<div class="l"><span>'+time+'</span></div>\
				</li>';
				ul.append(li);
			}

			if(ul.html()=="")ul.html("<div style='font-size:40px;padding:50px 0;text-align:center;'>无视频</div>");

			for(var i in groupdiv){
				groupdiv[i].sort((a, b) => b.num - a.num);
				var html='';
				for(var j in groupdiv[i]){
					var x=i==0?("tid='"+groupdiv[i][j].tid+"'"):("mid='"+groupdiv[i][j].mid+"'");
					html+="<a "+x+">"+groupdiv[i][j].name+"("+groupdiv[i][j].num+")</a>";
				}
				group.eq(i).find("p").html(html);
			}

		}

	}
	function scrollPage(css,lis){
		var ul=$(".bili dd."+css+" ul");
		if(ul.attr("scrollPage"))return;
		ul.attr("scrollPage",1);

		var ptime=0;
		$(window).scroll(function(){
			if($(this).scrollTop() + $(window).height()+200 >= $("body").height()){
				if(!$(".bili dd."+css).hasClass("on"))return;
				var t=Date.parse(new Date());
				if((t-ptime)<1000)return;// console.log("scrollPage-stop");
				ptime=t;
				lis();
			}
		});
	}
	function xinjiu(css,time){
		if(!css)css="";
		if(heilis.oldday>0 && time<heilis.oldvideo)css+=" old";
		else if(heilis.newday>0 && time>heilis.newvideo)css+=" new";
		return css;
	}
	function html(css,name,pre,timeout){
		if(!(timeout>0))timeout=120;//默认60秒后点击将刷新
		if(!$(".bili ."+css)[0]){
			if(pre){
				$(".bili dt").prepend("<b class='"+css+"'>"+name+"</b>");
			}else{
				$(".bili dt").append("<b class='"+css+"'>"+name+"</b>");
			}
			$(".bili").append("<dd class='"+css+"' timeout='"+timeout+"' time='"+$.now()+"'><ul></ul></dd>");
		}
		return $(".bili ."+css+" ul");
	}
	//过滤
	function guolv(bvid,title,author){
		if(bvid && heilis.video.indexOf(bvid)>-1)return false;
		if(author && $.inArray(author,heilis.author)>-1)return false;
		if(title){
			for(var i in heilis.title)
			if(title.indexOf(heilis.title[i])>-1)return false;
		}
		return true;
	}
	//下面几个是格式化f
	function pic(src){
		if(!src)return'';
		src=src.replace("http://",'').replace("https://",'').replace("//","");
		if(src.indexOf('@')==-1)src+="@200w_130h_1c_!web-search-common-cover.webp";//@672w_378h
		//return '<u><img src="no.png" class="lazy" data-original="https://'+src+'"/></u>';
		return '<u><img src="https://'+src+'"/></u>';
	}

	function viewBvid(bvid){
		if(!bvid)return false;
		chrome.windows.getAll({populate: true},function(wins) {
			var find=false;
			for (var i = 0; i < wins.length; i++) {
				if (wins[i].id == localStorage["oneWinId"]) {
					find=wins[i].tabs[0].id;
					break;
				}
			}
			if(find){
				//让player.html执行,避免全屏的时候，被改变窗口
				chrome.runtime.sendMessage({connect:sendMessage.biliPlayer,act:sendMessage.playbvid,bvid:bvid},
					function(response) {
						if(response)return;
						oneWin("bilibili_player.html?bvid="+bvid,0,0,heilis.xianshiqi);
						layer.msg("通讯中断，刷新播放器");
					}
				);
			}else{
				oneWin("bilibili_player.html?bvid="+bvid,0,0,heilis.xianshiqi);
			}
		})
		return true;
	}

	//---------
	this.index=function(){
		$(".missde .tab .rbox").append("<div class='user'></div>");
		var userDiv=$(".missde .tab .user");
		$(".missde .tab .menu").append('<a title="转到B站官网看视频" class="bililogo" href="https://www.bilibili.com/" target="_blank"><img src="'+logo+'" /></a>');
		$(".missde .tab .menu a:first").addClass("on");
		$(".missde").addClass(heilis.style);



		if(!$(".missde .box")[0])return layer.msg("模板出错了");
		$(".missde .box").html('<dl class="bili"><dt></dt></dl>');

		//告诉player.html,当前图标
		chrome.runtime.sendMessage({connect:sendMessage.biliPlayer,icons:heilis.icons});


		this.hot();//热门
		this.suiji();//随机
		this.search();//搜索
		this.lishi();//本地播放历史清单
		this.playing();//播放清单
		this.fav();//收藏
		this.setup();//设置
		//当前用户信息
		get(URL.islogin,function(db){
			db=db.data;
			root.user.login=db.isLogin;
			if(root.user.login){
				root.user.login=db.isLogin;
				root.user.head=db.face;
				root.user.id=db.mid;
				root.user.name=db.uname;
				root.user.yingbi=db.money;

				userDiv.append("<a class='head' href='https://message.bilibili.com/?spm_id_from=..0.0#/reply' target='_blank'><img src='"+db.face+"@100w_100h_1c_!web-search-common-cover.webp'></a>")
				userDiv.find(".head").mouseover(function() {
					var html='<b>'+root.user.name+'</b>'
						+"<br/>硬币："+root.user.yingbi
						+"<br/>关注："+root.user.following
						+"<br/>粉丝："+root.user.follower
					if(root.user.smsnum)html+="<br/>消息："+root.user.smsnum;
					layer.tips(html, $(this)[0], {
						tips: [2, heilis.style=="fense"?'#F56DAC':'#128aad'],
						time: 4000
					});
				}).mouseout(function(){
					layer.closeAll();
					userSmsNum(1);
				})

				get(URL.nav,function(x){
					root.user.following=x.data.following;
					root.user.follower=x.data.follower;
				})
				/*
				get(URL.userinfo+db.mid,function(x){
					root.user.view=x.data.archive.view;
				})*/

				userSmsNum();
				function userSmsNum(timeout){
					if(!timeout && $.now()-root.user.smsnum_time<60000)return;//1分钟内不刷新
					//系统消息数
					get(URL.sms,function(x){
						root.user.smsnum=x.data.unfollow_unread+x.data.follow_unread;
						root.user.smsnum_time=$.now();
						var weidu=x.data.biz_msg_follow_unread;
						if($(".head i")[0])$(".head i").text(root.user.smsnum)
						else $(".head").append("<i>"+root.user.smsnum+"</i>");
						if(!(root.user.smsnum>0))$(".head i").hide();
					})
				}
				setInterval(function(){userSmsNum()},600000);//10分钟1次
			}else{
				userDiv.append("<a href='https://www.bilibili.com/account/history' class='login' target='_blank'>登录BiliBili</a>");
			}
			root.guanzhu();//关注的UP的视频 + 9条根据收藏、点赞、播放单关联的视频
		})


		//绑定事件
		$(".bili dt b").eq(0).addClass("on");
		$(".bili dd").eq(0).addClass("on");


		//左侧双击强制刷新
		$('.bili dt').on("dblclick","b",function(){
			clearTimeout(root.DTB_clickTimer);
			DTB_click($(this),1)
		});

		//左侧点击
		$(".bili dt").on("click","b",function(){
			heilis.oldvideo=$.now()/1000-heilis.oldday*86400;
			heilis.newvideo=$.now()/1000-heilis.newday*86400+86400;

			DTB_click($(this));
			layer.closeAll();
		});
		function DTB_click(B,timeout){
			root.DTB_clickTimer = setTimeout(function() {
				var css=B.attr("class").replace(/ .*/g,"");
				$("b."+css+",dd."+css).addClass("on").siblings().removeClass("on");

				var dd=$("dd."+css);
				if(!timeout)timeout=dd.attr("time")-0+dd.attr("timeout")*1000;
				if(dd.find("ul li").length<1 || $.now()>timeout){
					$(this).scrollTop(0);
					dd.find("ul").removeAttr("page").removeAttr("scrollpage").removeAttr("offset").html("");
					dd.attr("time",$.now());
					//eval("root."+css+"();");
					if(css=='guanzhu')root.guanzhu();
					else if(css=='hot')root.hot();
					else if(css=='suiji')root.suiji();
					else if(css=='search'){
						root.search();
						$(".rbox form").submit();
					}else if(css=='lishi')root.lishi();
					else if(css=='playing')root.playing();
					else if(css=='fav')root.fav();
					else if(css=='setup')root.setup();
				}
			})
		}

		$(".bili").on("mouseover", "li", function () {
			if($(this).find(".r")[0])return;
			var A=$(this).find("a");
			if(!A.attr("bvid"))return;
			var favon=favlis_[A.attr("bvid")]?"on":"";
			$(this).append('<div class="r">\
			<a href="https://www.bilibili.com/video/'+A.attr("bvid")+'" target="kanbili" class="kanbili"><img src="'+logo+'"/></a>\
			<b></b>\
			<i class="'+favon+'"></i>\
			<del></del>\
			</div>');
		});



		//添加播放队列
		$(".bili").on("click", "li .r b,li .r i", function () {
			var type=$(this)[0].nodeName=="I"?'favlis':'playlis';
			var A=$(this).parent().parent().find("A");
			var bvid=A.attr("bvid");
			var video={bvid:bvid,aid:A.attr("aid"),title:A.attr("tit"),img:A.find("img").attr("src").replace(/\?.*/g,"")}
			var old=type=='favlis'?favlis:playlis;

			var cunzai=0;
			var tishi='';
			var temp=[];
			for(var i in old){
				if(old[i].bvid!=bvid)temp.push(old[i]);
				else cunzai=1;
			}
			if(type=="favlis"){
				favlis_[bvid]=!cunzai;
				if(cunzai){
					$(this).removeClass("on");
					tishi="已取消收藏";
					$(".bili #fav_"+bvid).slideUp(function(){
						$(this).remove();
					})
				}else{
					$(this).addClass("on");
					temp.unshift(video);
					tishi="已经加入收藏";
					$(".bili dd.fav ul").html("");
					if($(".bili dt .fav").hasClass("on"))$(".bili dt .fav").click();
				}
				favlis=temp;
				C.set("favlis",temp);
				layer.msg(tishi);

				get(URL.favlis+root.user.uid,function(db){
					if(!db.data)return console.log("error");
					//收藏到bilibili网--默认收藏夹
					var folder=db.data.list[0].id;
					var url=URL.kuayu+'fav/'+(cunzai?2:1)+'_'+video.aid+'_'+folder+'_'+root.user.csrf+'/';
					var iframe=$("#bili_fav_iframe");
					if(iframe[0]){
						iframe.attr("src",url);
					}else{
						iframe = document.createElement('iframe');
						iframe.style.cssText = 'display: none;';
						iframe.id="bili_fav_iframe";
						iframe.src = url;
						document.body.appendChild(iframe);
					}
				});
			}else{
				temp.push(video);
				playlis=temp;
				C.set("playlis",temp);

				if($(".bili dd.playing").hasClass("on")){
					$(".bili #playlis_"+bvid+" a").removeClass("hui");
					layer.msg("重新加入成功");
				}else{
					$(".bili dd.playing ul").html("");
					layer.msg("已经加入播放单");
				}
			}

		});

		$(".bili").on("click","li a[bvid]",function(){
			viewBvid($(this).attr('bvid'));
			return false;
		});
		$(".bili").on("click","li del",function(){
			var dd=$(this).parent().parent().parent().parent();
			var bvid=$(this).parent().find("a").attr("delbvid");
			if(!bvid)bvid=$(this).parent().parent().find("a").attr("bvid");
			if(!bvid)bvid=$(this).parent().parent().find("a").attr("delbvid");
			var fenlei="";
			if(dd.hasClass("lishi"))fenlei="record";
			else if(dd.hasClass("playing"))fenlei="playlis";
			if(fenlei){
				var lis=C.get(fenlei,'array');
				var i = lis.findIndex((json) => json.bvid==bvid);
				if(i>-1){
					lis.splice(i,1);//删除
					C.set(fenlei,lis);
					if(fenlei=="record")record=lis;
					else if(fenlei=="playlis")record=playlis;
				}

			}else{
				//拉黑 1000个
				if(heilis.video.indexOf(bvid)==-1){
					heilis.video+=heilis.video==""?bvid:(","+bvid);
					var x=heilis.video.split(",");
					if(x.length>2000){
						x.shift();
						heilis.video=x.join(',');
					}
					C.set("heilis",heilis);
					$("dd.setup ul").html('');
				}else{
					//还原
					if(heilis.video.indexOf(","+bvid)>-1)heilis.video=heilis.video.replace(","+bvid,"");
					else if(heilis.video.indexOf(bvid+",")>-1)heilis.video=heilis.video.replace(bvid+",","");
					else if(heilis.video==bvid)heilis.video='';
					C.set("heilis",heilis);
					$("dd.setup a[delbvid='"+bvid+"']").parent().remove();
					layer.msg("已撤回");
					return;
				}
			}

			$(this).parent().parent().find("a").slideUp(function(){
				$(this).parent().remove();
			})

		})
	}
	this.search=function(){
		var ul=html('search','🔍搜索');
		//if(!$(".bili .search").hasClass("on"))return;

		if($(".missde .tab .rbox form")[0])return;
		$(".missde .tab .rbox").append('<form>\
			<input autocomplete="off" name="keyword" type="text"/>\
			<input type="submit" value="搜索"/>\
			<p>\
				<label order="" class="on">综合</label>\
				<label order="pubdate">时间</label>\
				<label order="click">点击</label>\
			</p>\
			</form>');

		$(".tab form").append("<div></div>");
		searchKey();
		$(".tab form").submit(function(){
			var keyword=$(".tab form input[name='keyword']").val();
			if(!keyword)layer.tips('请输入关键词',$(".tab form input[name='keyword']"),{tips:[3, heilis.style=="fense"?'#F56DAC':'#128aad']});
			else search(keyword);
			return false;
		})
		$(".tab form").on("click","div a",function (){
			ul.html("").attr("page",0).attr("scrollpage",0);
			search($(this).text())
		})
		$(".tab form div").on("click","del",function (){
			$(this).parent().remove();
			var temp=[];
			$(".tab form div a").each(function(){
				temp.push($(this).text());
			})
			searchkey=temp;
			C.set("searchkey",temp);
		})
		$(".missde .rbox form p label").click(function(){
			root.searchOrder=$(this).attr("order");
			$(this).addClass("on").siblings().removeClass("on");
			$(".tab form input[type='submit']").click();
		});


		function searchKey(){
			var div=$(".tab form div");
			div.html('');
			for(var i in searchkey){
				div.append("<span><a>"+searchkey[i]+"</a><del></del></span>");
			}
		}
		function search(keyword){
			$(".bili .search").addClass("on").siblings().removeClass("on");

			//是B站bvid
			const bili = /BV\w{10}/ig.exec(keyword);
			if(bili && bili[0]){
				$(".tab form input[name='keyword']").val(bili[0]);
				viewBvid(bili[0]);
				return layer.msg("正在打开视频");
			}
			keyword=keyword.replace(/\<|\>|\*|\\|\/|\!|\'|\"|\?/g,'');
			var temp=[];
			for(var i in searchkey){
				if(temp.length<30 && searchkey[i]!=keyword)temp.push(searchkey[i]);
			}

			temp.unshift(keyword);
			C.set("searchkey",temp);
			searchkey=temp
			searchKey();
			//if($(".tab form input[name='keyword']").attr("bak")==keyword)return;
			$(".tab form input[name='keyword']").val(keyword).attr("bak",keyword);



			ul.html('');
			var page=1;

			scrollPage('search',function(){
				lis($(".bili dd.search ul").attr("page")-0+1);
			});

			var page_;

			lis(page);

			function lis(page){
				if(page_==page)return console.log('s-stop',page);
				page_=page;

				var keyword=$(".tab form input[name='keyword']").val();
				var url=URL.search+encodeURIComponent(keyword);
				var order=root.searchOrder?("&order="+root.searchOrder):"";


				get(url+"&page="+page+order,function(db){
					ul.attr("page",page);
					if(!db.data)return ;
					db=db.data.result;//旧版本
					if(db[0].result_type){
						var db_=db;
						db=db[10].data;//全搜索版
						if(page==1){
							if(db_[5].data.length){
								var u=db_[5].data[0];
								ul.append("<li class='upzhu'><a href='"+u.goto_url+"' target='kanbili'>"+pic(u.cover)+
								"<b>"+u.title+"<br/>"+u.index_show+"</b></a></li>");
								for(var i=u.length-1;i>=0;i--){
									u.res[i].author=u.uname;
									db.unshift(u.res[i]);
								}
							}else if(db_[7].data.length){
								var u=db_[7].data[0]
								ul.append("<li class='upzhu'><a href='https://space.bilibili.com/"+u.mid+"' target='kanbili'>"+pic(u.upic)+
								"<b>"+u.uname+" (UP主)<br/>粉丝:"+wan(u.fans)+" 视频:"+u.videos+"</b></a></li>");
								for(var i=u.res.length-1;i>=0;i--){
									u.res[i].author=u.uname;
									db.unshift(u.res[i]);
								}
							}
						}
					}
					var lis_temp={};
					for(var i in db){
						if($('#search_'+db[i].bvid)[0])continue;
						if(!guolv(db[i].bvid,db[i].title,db[i].author))continue;

						if(heilis.yin.search && viewlis.indexOf(db[i].bvid)>-1)continue;//跳过看过的 视频


						var css=viewlis.indexOf(db[i].bvid)>-1?'hui':'';
						css=xinjiu(css,db[i].pubdate);

						var title=db[i].title.replace(/<.[^\>]*>/g,"");
						//var li=
						lis_temp[db[i].pubdate]='<li id="search_'+db[i].bvid+'"><a href="'+https(db[i].arcurl)+'" target="kanbili" class="'+css+'" tit="'+title+'" bvid="'+db[i].bvid+'" aid="'+db[i].aid+'">\
						'+pic(db[i].pic)+'\
						<p>'+db[i].author+' ('+cdate(db[i].pubdate)+')</p>\
						<b>'+title+'<i></i></b></a>\
						<div class="l"><b>'+wan(db[i].play)+'</b><u>'+wan(db[i].like)+'</u><span>'+db[i].duration+'</span></div>\
						</li>';
						//ul.append(li);
					}
					var html="";
					for(var i in lis_temp)html=lis_temp[i]+html;
					ul.append(html);

					page_='';
					if(db.length==20 && page<3 && ul.find("li").length<30)lis(page+1);
				})
			}
		}

	},
	this.hot=function(){
		var ul=html('hot','🔥热门');
		if(!$(".bili .hot").hasClass("on"))return;
		var page=ul.attr("page")>0?ul.attr("page"):1;

		scrollPage('hot',function(){
			lis($(".bili dd.hot ul").attr("page")-0+1);
		});

		var page_;

		lis(page);
		function lis(page){
			if(page_==page || isNaN(page))return;
			page_=page;
			get(URL.hot+page,function(db){
				ul.attr("page",page);
				for(var i in db.data.list){
					var li=db.data.list[i];
					if($('#hot_'+li.bvid)[0])continue;
					if(heilis.yin.hot && viewlis.indexOf(li.bvid)>-1)continue;//跳过看过的 视频
					if(!guolv(li.bvid,li.title,li.owner.name))continue;

					if(li.stat.view>10000)li.stat.view=(li.stat.view/10000).toFixed(1)+"万";//访问量
					if(li.stat.like>10000)li.stat.like=(li.stat.like/10000).toFixed(1)+"万";//
					var l=recordJindu[li.bvid]?recordJindu[li.bvid]:0;

					var css=viewlis.indexOf(li.bvid)>-1?'hui':'';
					var time=formatTime(li.duration);
					var date=cdate(li.pubdate);
					css=xinjiu(css,li.pubdate);

					var li='<li id="hot_'+li.bvid+'"><a href="'+https(li.short_link)+'" target="kanbili" class="'+css+'" tit="'+li.title+'" bvid="'+li.bvid+'" aid="'+li.aid+'">\
					'+pic(li.pic)+'\
					<p>'+li.owner.name+' ('+date+')</p>\
					<b>'+li.title+'<i style="width:'+l+'"></i></b></a>\
					<div class="l"><b>'+li.stat.view+'</b><u>'+li.stat.like+'</u><span>'+time+'</span></div>\
					</li>';
					ul.append(li);
				}
				page_='';
			})
		}

	}


	this.guanzhu=function(){
		//if(!root.user.login)return console.log("no login");
		var ul=html('guanzhu','🚩喜欢','pre');
		$("b.guanzhu,dd.guanzhu").addClass("on").siblings().removeClass("on");
		//感兴趣的N个视频
		var xg=[];
		if(zanlis){
			//点赞的
			var zan=zanlis.split(",");
			for(var i in zan)if(zan[i] && i>=(zan.length-10))xg.push(zan[i]);
		}
		//最近播放的(观看进度 > 40% )
		for(var i in record){
			if(!guolv(record[i].bvid))continue;
			if($.inArray(record[i].bvid,xg)==-1 && i<=10){
				var r=record[i];
				if((r.vtime/r.vlong)>0.4 || r.vtime<3)xg.push(r.bvid);
			}
		}


		//播放列表中的
		//for(var i in playlis)if($.inArray(playlis[i].bvid,xg)==-1 && i<=3)xg.push(playlis[i].bvid);

		//收藏列表中的
		//for(var i in favlis)if($.inArray(favlis[i].bvid,xg)==-1 && i<=3)xg.push(favlis[i].bvid);

		xg=xg.sort(() => 0.5 - Math.random());

		var xgI=0;
		for(var i in xg){
			if(!xg[i])continue;
			//if(guolv(xg[i]))continue;
			if(++xgI>3)break;

			get(URL.xianguan+xg[i],function(db){
				if(!db.data)return;
				db=db.data.Related;
				if(db.length<1)return;
				var x=db.sort(() => 0.5 - Math.random());
				var j=3;//抽取3个
				if(!root.user.uid)j=20;
				for(var i in x){
					var li=x[i];
					if(viewlis.indexOf(li.bvid)>-1)continue;//跳过看过的 视频
					var user=li.owner.name
					var like=li.stat.like;
					if(!guolv(li.bvid,li.title,user))continue;
					var play=li.stat.view;
					if(play>10000)play=(play/10000).toFixed(1)+"万";//访问量
					var l=recordJindu[li.bvid]?recordJindu[li.bvid]:0;
					var css=xinjiu('',li.pubdate);

					var li='<li id="guanzhu_'+li.bvid+'"><a class="'+css+'" href="'+https(li.short_link)+'" target="kanbili" tit="'+li.title+'" bvid="'+li.bvid+'" cid="'+li.cid+'" aid="'+li.aid+'">\
					'+pic(li.pic)+'\
					<p>'+user+' ('+cdate(li.pubdate)+')</p>\
					<b>'+li.title+'<i style="width:'+l+'"></i></b></a>\
					<div class="l"><b>'+play+'</b><span>'+formatTime(li.duration)+'</span></div>\
					</li>';
					ul.prepend(li);
					if(j--<=1)break;
				}
				//DIV的宽高调整

			})
		}

		scrollPage('guanzhu',function(){
			lis($(".bili dd.guanzhu ul").attr("offset"));
		});


		//关注的视频
		var page_='';
		lis(ul.attr("offset"));

		function lis(page){
			if(!root.user.uid)return console.log('没有登录');//没有登录
			if(page_==page)return console.log("stop:"+page,page_,page);
			if(!page)page='';
			page_=page;
			if(page<10000)page="";
			get(URL.guanzhu+page,function(db){
				if(!db.data)return layer.msg("数据为空");

				ul.attr("offset",db.data.offset);
				for(var i in db.data.items){
					var li=db.data.items[i].modules.module_dynamic.major;
					if(!li)continue;
					if(!li.archive)continue;
					if(heilis.yin.guanzhu && viewlis.indexOf(li.archive.bvid)>-1)continue;//跳过看过的 视频
					if($('#guanzhu_'+li.archive.bvid)[0])continue;

					var css=viewlis.indexOf(li.archive.bvid)>-1?'hui':'';
					var user=db.data.items[i].modules.module_author.name
					var like=db.data.items[i].modules.module_stat.like.count;
					var time=db.data.items[i].modules.module_author.pub_time;

					css=xinjiu(css,db.data.items[i].modules.module_author.pub_ts);

					if(!guolv(li.archive.bvid,li.archive.title,user))continue;


					var play=li.archive.stat.play;
					if(play>10000)play=(play/10000).toFixed(1)+"万";//访问量
					var l=recordJindu[li.archive.bvid]?recordJindu[li.archive.bvid]:0;


					var li='<li id="guanzhu_'+li.archive.bvid+'"><a href="'+https(li.archive.jump_url)+'" target="kanbili" class="'+css+'" tit="'+li.archive.title+'" bvid="'+li.archive.bvid+'" aid="'+li.archive.aid+'">\
					'+pic(li.archive.cover)+'\
					<p>'+user+' ('+time+')</p>\
					<b>'+li.archive.title+'<i style="width:'+l+'"></i></b></a>\
					<div class="l"><b>'+play+'</b><span>'+li.archive.duration_text+'</span></div>\
					</li>';
					ul.append(li);
				}
				page_='';
				if(ul.find("li").length<30)setTimeout(function(){lis(db.data.offset)});
			})
		}
	}


	this.setup=function(){
		var ul=html('setup','⚙️设置');
		if(!$(".bili .setup").hasClass("on"))return;


		var lis=heilis.video.split(",");
		var T;
		ul.html("");
		var dd=ul.parent();
		if(dd.find("div").length>0){
			dd.find("div.title,div.author").html("");
		}else{
			ul.before("<div class='btn'>\
				<div><h3>插件说明</h3>\
					<p>因为在电脑上浏览B站的时候，不能屏蔽掉不喜欢的视频、不能设置播放列表、不能指定指定窗口播放、搜索总是旧内容在前等等…… </p>\
					<p>于是在一个周末，我做了这个插件，让bilibili在我的浏览器上变形了~~</p>\
					<div style='float:left;border:1px solid #ddd;border-radius:10px;padding:10px;background:#f6f6f6;'><p>①使用F键，全屏观看视频。</p>\
						<p>②双击左侧的按钮，执行刷新列表。</p>\
						<p>③播放列表、屏蔽设置，都存在浏览器缓存中，很容易就消失不见，请手动导出配置进行备份。</p>\
						<p>④这个插件主要用来浏览UP主上传的视频，追番请到<a href='https://www.bilibili.com/anime/' target='_blank'>B站官网</a>~</p>\
					</div>\
					<div class='dashang' style='clear:none;float:left;margin-left:50px;'>\
						<img src='pic/dashang.jpg'/>\
					</div>\
				</div>\
				<div><h3>插件设置</h3></div>\
				<div>\
					<span>插件风格：</span>\
					<label for='style0'><input id='style0' name='style' type='radio' value='fense' checked/><img src='pic/bilibili_fense.svg' style='height:25px'/></label>\
					<label for='style1'><input id='style1' name='style' type='radio' value='lanse'/><img src='pic/bilibili_lanse.svg' style='height:25px'/></label>\
					<span style='margin-left:220px;'>插件图标：</span>\
					<label for='radio1'><input id='radio1' name='icons' type='radio' value='1' checked/><img src='pic/1.png' style='width:25px'/></label>\
					<label for='radio2'><input id='radio2' name='icons' type='radio' value='2'/><img src='pic/2.png' style='width:25px'/></label>\
					<label for='radio3'><input id='radio3' name='icons' type='radio' value='3'/><img src='pic/3.png' style='width:25px'/></label>\
				</div>\
				<div class='xianshiqi'>\
					<span>播放窗口默认宽度：</span>\
					<label for='winwidth360'><input id='winwidth360' name='winwidth' type='radio' value='360'/>半杯</label>\
					<label for='winwidth540'><input id='winwidth540' name='winwidth' type='radio' value='540'/>小杯</label>\
					<label for='winwidth720'><input id='winwidth720' name='winwidth' type='radio' value='720'/>中杯</label>\
					<label for='winwidth960'><input id='winwidth960' name='winwidth' type='radio' value='960'/>大杯</label>\
					<label for='winwidth1080'><input id='winwidth1080' name='winwidth' type='radio' value='1080'/>超大杯</label>\
					<span style='margin-left:30px;'>默认显示在：</span>\
					<label for='xianshiqi0'><input id='xianshiqi0' name='xianshiqi' type='radio' value='0' checked/>显示器1</label>\
				</div>\
				<div class='yin'>\
					<span>隐藏看过的视频：</span>\
					<label for='yin_guanzhu'><input id='yin_guanzhu' name='guanzhu' type='checkbox' value='1'/>关注</label>\
					<label for='yin_hot'><input id='yin_hot' name='hot' type='checkbox' value='1'/>热门</label>\
					<label for='yin_suiji'><input id='yin_suiji' name='suiji' type='checkbox' value='1'/>随机</label>\
					<label for='yin_search'><input id='yin_search' name='search' type='checkbox' value='1'/>搜索</label>\
				</div>\
				<div class='yin'>\
					<span>标记新视频：</span>\
					<label for='newday0'><input id='newday0' name='newday' type='radio' value='0'/>不标记</label>\
					<label for='newday3'><input id='newday3' name='newday' type='radio' value='3'/>3天内</label>\
					<label for='newday7'><input id='newday7' name='newday' type='radio' value='7'/>7天内</label>\
					<label for='newday10'><input id='newday10' name='newday' type='radio' value='10'/>10天内</label>\
					<label for='newday15'><input id='newday15' name='newday' type='radio' value='10'/>15天内</label>\
				</div>\
				<div class='yin'>\
					<span>标记旧视频：</span>\
					<label for='oldday0'><input id='oldday0' name='oldday' type='radio' value='0'/>不标记</label>\
					<label for='oldday7'><input id='oldday7' name='oldday' type='radio' value='7'/>7天前</label>\
					<label for='oldday15'><input id='oldday15' name='oldday' type='radio' value='15'/>15天前</label>\
					<label for='oldday30'><input id='oldday30' name='oldday' type='radio' value='30'/>30天前</label>\
					<label for='oldday60'><input id='oldday60' name='oldday' type='radio' value='60'/>60天前</label>\
					<label for='oldday100'><input id='oldday100' name='oldday' type='radio' value='100'/>100天前</label>\
				</div>\
				<div>\
					<a class='a export'>导出配置</a>\
					<a class='a file'>导入配置<input type='file' accept='.json'/></a>\
					<a class='a clslishi'>清空历史</a>\
					<a class='a clsvideo'>清空屏蔽的视频</a>\
				</div>\
				</div>");

			ul.before("<div class='title'></div>");
			ul.before("<div class='author'></div>");



			//风格
			$(".bili .setup input[name='style']").click(function(){
				var style=$(this).val();
				heilis.style=style;
				C.set("heilis",heilis);
				logo='pic/bilibili_'+heilis.style+'.svg';
				$(".bililogo img,.kanbili img").attr("src",logo);
				$(".missde").attr("class","missde "+heilis.style);

			})
			//图标
			$(".bili .setup input[name='icons']").click(function(){
				heilis.icons=$(this).val();
				C.set("heilis",heilis);

				chrome.runtime.sendMessage({connect:sendMessage.backgroundJS,icons:heilis.icons,page:sendMessage.biliPlayer});
				chrome.runtime.sendMessage({connect:sendMessage.biliPlayer,icons:heilis.icons});
			})

			//几个显示器
			chrome.system.display.getInfo(function(displays) {
				for(i in displays){
					if(i>0){
						$(".bili .setup .xianshiqi").append("<label for='xianshiqi"+i+"'><input id='xianshiqi"+i+"' name='xianshiqi' type='radio' value='"+i+"'/>显示器"+(i-0+1)+"</label>");
					}
				}
				if(heilis.xianshiqi>0)$('.bili .setup input[name="xianshiqi"][value="'+heilis.xianshiqi+'"]:first').prop('checked', true);

			})

			$(".bili .setup input[name='winwidth']").click(function(){
				heilis[$(this).attr("name")]=$(this).val();
				C.set("heilis",heilis);
				chrome.runtime.sendMessage({connect:sendMessage.biliPlayer,act:sendMessage.resize});
			})



			$(".bili .setup input[name='newday'],.bili .setup input[name='oldday'],.bili .setup input[name='winwidth']").click(function(){
				heilis[$(this).attr("name")]=$(this).val();
				C.set("heilis",heilis);
				if($(this).val()<1){
					$('.bili li a').removeClass($(this).attr("name"));
				}else{
					$(".bili ul[page],.bili ul[scrollpage]").removeAttr("page").removeAttr("scrollpage").removeAttr("offset").html("");//清除列表
				}
			})

			$(".bili .setup").on("click",".xianshiqi input[name='xianshiqi']",function(){
				if(heilis.xianshiqi==$(this).val())return;
				heilis.xianshiqi=$(this).val();
				C.set("heilis",heilis);

				chrome.runtime.sendMessage({connect:sendMessage.biliPlayer,act:sendMessage.URL},
					function(response) {
						if(!response)return;
						if(!response.url)return;
						var r = response.url.replace("undefined","").match(/bvid=\w+/ig);
						if(r)r=r[r.length-1].replace(/bvid\=/i,'');
						if(!r)return;
						setTimeout(function(){viewBvid(r)},500);

					}
				);




			})


			$(".bili .setup .btn .yin input").click(function(){
				heilis.yin[$(this).attr("name")]=$(this).is(":checked")?1:0;
				C.set("heilis",heilis);
				$(".bili dd."+$(this).attr("name")+" ul").html('');
			})


			$(".bili .setup .btn .clslishi").bind('click',function(){
				layer.confirm('确定要清空历史记录？', {
					btn: ['清空','放弃']
				}, function(){
					record=[]
					C.set("record",record);
					$(".bili dd.lishi ul").html("");
					layer.msg("已清空");
				}, function(){
					//
				});
			})

			$(".bili .setup .btn .clsvideo").bind('click',function(){
				layer.confirm('确定要清空屏蔽的视频？', {
					btn: ['清空','放弃']
				}, function(){
					heilis.video='';
					C.set("heilis",heilis);
					$(".bili dd.setup ul").html("").attr("count","");
					layer.msg("已清空");
				}, function(){
					//
				});
			})

			$(".bili .setup .btn .export").bind('click',function(){
				leadingOut();
			})
			$(".bili .setup .btn .file input").change(function(e) {
				leadingIn(e.target.files[0]);
			});

			$(".bili .setup div.title,.setup div.author").bind('input', function(){
				S($(this).prop("state"));
			}).on('compositionstart', function () {
				clearTimeout(T);
				$(this).prop('state', true);
			}).on('compositionend', function () {
				$(this).prop('state', false);
				S($(this).prop("state"));
			});

			var S=function(state){
				if(state)return;
				clearTimeout(T);
				T=setTimeout(function(){
					var title=[];
					var kong=false;
					$(".bili .setup .title input").each(function(){
						var v=$(this).val();
						if(v)title.push(v);
						else kong=true;
					})
					heilis.title=title;
					if(!kong)$(".bili .setup .title").prepend("<input/>");

					var author=[];
					var kong=false;
					$(".bili .setup .author input").each(function(){
						var v=$(this).val();
						if(v)author.push(v);
						else kong=true;
					})
					heilis.author=author;
					if(!kong)$(".bili .setup .author").prepend("<input/>");

					//heilis.bilifav=$(".bili .setup .btn input[name='bilifav']").is(":checked")?1:0

					C.set("heilis",heilis);


					$(".bili .setup .title").attr("count","("+(heilis.title.length)+")");
					$(".bili .setup .author").attr("count","("+(heilis.author.length)+")");


				},2000);
			}
		}

		if(!heilis.yin)heilis.yin={};
		$(".bili .setup input[name='bilifav']").prop("checked",heilis.bilifav==1);
		$(".bili .setup .yin input[name='guanzhu']").prop("checked",heilis.yin.guanzhu==1);
		$(".bili .setup .yin input[name='hot']").prop("checked",heilis.yin.hot==1);
		$(".bili .setup .yin input[name='suiji']").prop("checked",heilis.yin.suiji==1);
		$(".bili .setup .yin input[name='search']").prop("checked",heilis.yin.search==1);


		$('.bili .setup input[name="style"][value="'+heilis.style+'"]:first').prop('checked', true);
		if(heilis.icons>0)$('.bili .setup input[name="icons"][value="'+heilis.icons+'"]:first').prop('checked', true);

		$('.bili .setup input[name="oldday"][value="'+(heilis.oldday||0)+'"]:first').prop('checked', true);
		$('.bili .setup input[name="newday"][value="'+(heilis.newday||0)+'"]:first').prop('checked', true);
		$('.bili .setup input[name="winwidth"][value="'+(heilis.winwidth||0)+'"]:first').prop('checked', true);




		lis.reverse();
		for(var i in lis){
			if(!lis[i])lis.splice(i,1);//删除
			if(lis[i] && i<200)ul.append('<li><a href="https://www.bilibili.com/video/'+lis[i]+'" target="kanbili" delbvid="'+lis[i]+'">'+lis[i]+'</a><del></del></li>');
		}
		if(lis.length>0)ul.attr("count","("+(lis.length)+")");




		var title=dd.find(".title");
		for(var i in heilis.title)if(i<50)title.append("<input type='text' value='"+heilis.title[i]+"'/>");
		title.prepend("<input type='text' placeholder='填写关键词'/>");
		if(heilis.title.length)title.attr("count","("+(heilis.title.length)+")");


		var author=dd.find(".author");
		for(var i in heilis.author)if(i<50)author.append("<input type='text' value='"+heilis.author[i]+"'/>");
		author.prepend("<input type='text' placeholder='填写UP主昵称'/>");
		if(heilis.author)author.attr("count","("+(heilis.author.length)+")");


	},

	this.playing=function(){
		var ul=html('playing','📀播单');
		if(!$(".bili .playing").hasClass("on"))return;
		//列表
		ul.html("");
		for(var i in playlis){
			if(!playlis[i])continue;
			if($('#playlis_'+playlis[i].bvid)[0])continue;
			var hui=playlis[i].played?"hui":"";
			var l=recordJindu[playlis[i].bvid]?recordJindu[playlis[i].bvid]:0;
			var li='<li id="playlis_'+playlis[i].bvid+'"><a class="'+hui+'" href="https://www.bilibili.com/video/'+playlis[i].bvid+'" target="kanbili" tit="'+playlis[i].title+'" bvid="'+playlis[i].bvid+'" cid="'+playlis[i].cid+'"  aid="'+playlis[i].aid+'">\
			'+pic(playlis[i].img)+'\
			<b>'+playlis[i].title+'<i style="width:'+l+'"></i></b></a>\
			</li>';
			ul.append(li);
		}
		if(ul.html()=="")ul.html("<div style='font-size:40px;padding:100px 0;text-align:center;'>播放清单是空的</div>")
	}


	this.fav=function(){
		html('fav','⭐收藏');
		jsonPage('fav',favlis)
	},

	this.lishi=function(){
		type=C.get("type","json");
		uper=C.get("uper","json");

		html('lishi','🗓️历史');
		if(!$(".bili .lishi .group")[0])$(".bili .lishi ul").before('<div class="groupbox"><div class="group"><div><b>分类：</b><p></p></div><div><b>作者：</b><p></p></div></div></div>');
		jsonPage('lishi',record);

	}

	this.suiji=function(){
		var ul=html('suiji','🌟随机');
		if(!$(".bili .suiji").hasClass("on"))return;// console.log("suiji-stop")
		ul.html('');
		var page=1;

		scrollPage('hot',function(){
			lis($(".bili dd.suiji ul").attr("page")-0+1);
		});


		var page_;

		lis(page);
		function lis(page){
			if(page_==page)return console.log("stop-suiji:"+page);
			page_=page;
			var time=($.now()/1000).toFixed();
			get(URL.suiji+time,function(db){
				if(db.code)return layer.msg(db.message);
				ul.attr("page",page);
				if(!db.data)return layer.msg("数据为空");
				for(var i in db.data.item){
					if(heilis.yin.suiji && viewlis.indexOf(db.data.item[i].bvid)>-1)continue;//跳过看过的 视频
					if($('#suiji_'+db.data.item[i].bvid)[0]){
						console.log("已经存在"+db.data.item[i].bvid);
						continue;
					}
					if(!guolv(db.data.item[i].bvid,db.data.item[i].title,db.data.item[i].owner.name))continue;

					var li=ul.find("li");

					var css=viewlis.indexOf(db.data.item[i].bvid)>-1?'hui':'';
					css=xinjiu(css,db.data.item[i].pubdate);

					var stat=db.data.item[i].stat;
					if(stat.view>10000)stat.view=(stat.view/10000).toFixed(1)+"万";
					if(stat.like>10000)stat.like=(stat.like/10000).toFixed(1)+"万";
					var time=formatTime(db.data.item[i].duration);

					var l=recordJindu[db.data.item[i].bvid]?recordJindu[db.data.item[i].bvid]:0;

					var li='<li id="suiji_'+db.data.item[i].bvid+'"><a href="'+https(db.data.item[i].uri)+'" target="kanbili" class="'+css+'" tit="'+db.data.item[i].title+'" bvid="'+db.data.item[i].bvid+'" cid="'+db.data.item[i].cid+'"  aid="'+db.data.item[i].id+'">\
					'+pic(db.data.item[i].pic)+'\
					<p>'+db.data.item[i].owner.name+' ('+cdate(db.data.item[i].pubdate)+')</p>\
					<b>'+db.data.item[i].title+'<i style="width:'+l+'"></i></b></a>\
					<div class="l"><b>'+stat.view+'</b><u>'+stat.like+'</u><span>'+time+'</span></div>\
					</li>';
					//ul.prepend(li);
					ul.append(li);
				}
				if(ul.find("li").length<30)setTimeout(function(){lis(page+1)},1000);
			});
		}
	}

	//-------------------------------------主页处理来自player.html的请求
	this.updateVtime=function(re){
		//刷新数据
		record=C.get("record",'array');
		var i = record.findIndex((json) => json.bvid==re.bvid);
		if(i<0)return;
		var w=(re.vtime/re.vlong*100).toFixed(1);

		record[i].vlong=parseInt(re.vlong);
		record[i].vtime=parseInt(re.vtime);
		if(w>90)record[i].watch=1;//进度条>90%标记为看完

		C.set("record",record);
		$("a[bvid='"+re.bvid+"'] b i").width(w+"%");
	}
	this.updateHTML=function(re){
		if(re.action=="playState"){
			//刷新数据
			record=C.get("record",'array');
			playlis=C.get("playlis",'array');
			viewlis=C.get("viewlis");

			//刷新历史列表
			var find = $("dd.lishi a[bvid='"+re.bvid+"']");
			if(find[0]){
				//
			}else{
				$("dd.lishi").html("<ul></ul>");
				if($(".bili dt b.lishi").hasClass("on"))$(".bili dt b.lishi").click();
			}

			//将当前视频状态改为灰色
			$("a[bvid='"+re.bvid+"']").addClass("hui");
			return;
		}else if(re.action=="favState"){
			var A=$(".bili a[bvid='"+re.bvid+"']").parent().find(".r i");
			if(re.state)A.addClass("on");
			else A.removeClass("on");

			//刷新收藏列表
			var find = $("dd.fav a[bvid='"+re.bvid+"']");
			if(find[0]){
				//
			}else{
				$("dd.fav").html("<ul></ul>");
				if($(".bili dt b.fav").hasClass("on"))$(".bili dt b.fav").click();
			}

			//刷新数据
			favlis=C.get("favlis",'array');
			favlis_={};
			for(var i in favlis)favlis_[favlis[i].bvid]=1;
		}

	}
	//-------------------------------------


	this.player=function(bvid){
		var root=this;
		root.layerT=layer.msg('正在分析网址',{offset:['30px','45%'],time:-1});
		//location.href=location.href.replace(/#.*/,"")+"#bvid="+bvid;
		root.oneWinICO();
		var db=get(URL.videoinfo+bvid);
		var cid=db.data.cid;
		var aid=db.data.aid;
		var url=db.data.redirect_url||"";
		var img=db.data.pic;
		var title=db.data.title;
		var maxtoubi=db.data.copyright>1?1:2;//最多投币数
		document.title=title;
		$("body").attr("class",heilis.style);
		$(".kanbili img").attr("src",'pic/bilibili_'+heilis.style+'.svg');

			//if(db.data.redirect_url)A.attr("href",db.data.redirect_url);
			//字幕地址
			//db.data.subtitle.allow_submit
			//db.data.subtitle.lis[0].subtitle_url


		//如果有多个视频合集
		var pages=db.data.pages ||[];

		//存储播放记录
		record=C.get("record",'array');
		var recordI = record.findIndex((json) => json.bvid==bvid);
		var time=parseInt($.now()/1000);
		if(recordI==-1){
			recordI=0;
			//缓存500条播放记录
			var maxpage=pages?pages.length:0;
			record.unshift({time:time,page:0,maxpage:maxpage,vlong:0,vtime:0,bvid:bvid,cid:cid,aid:aid,title:title,img:img,tid:db.data.tid,mid:db.data.owner.mid});
			if(record.length>500)record.pop();
			C.set("record",record);
		}else{
			var temp=record[recordI];
			temp.tid=db.data.tid;
			temp.mid=db.data.owner.mid;
			temp.time=time;
			if(pages[temp.page])cid=pages[temp.page].cid;

			//放到开头
			record.splice(recordI, 1);
			record.unshift(temp);
			C.set("record",record);
		}

		if(!type[db.data.tid]){
			type[db.data.tid]=db.data.tname;
			C.set("type",type);
		}

		if(!uper[db.data.owner.mid]){
			uper[db.data.owner.mid]=db.data.owner.name;
			C.set("uper",uper);
		}


		//2000个观看bvid，用户灰色提示
		var x=viewlis==""?bvid:(","+bvid);
		if(viewlis.indexOf(bvid)==-1){
			viewlis+=x;
			var x=viewlis.split(",");
			if(x.length>2000){
				x.shift();
				viewlis=x.join(',');
			}
			C.set("viewlis",viewlis);
		}


		//传递给主页--更改HTML
		chrome.runtime.sendMessage({connect:sendMessage.biliIndex,act:sendMessage.HTML,bvid:bvid,action:"playState"});


		function videoURL(cid,bvid,aid){
			layer.close(root.layerT);
			root.layerT=layer.msg('正在寻找视频',{offset:['30px','45%'],time:-1});
			$(".xianguan").hide();

			if(!root.user.uid)$(".player .r .user").hide();
			else $(".player .r .user").show();
			//console.log(root.user);
			//用于解决刷问题
			location.href=location.href.replace(/#.*/,"")+"#bvid="+bvid;


			//如果在播放列表中
			var i = playlis.findIndex((json) => json.bvid==bvid);
			if(i>-1){
				playlis[i].played=1;
				C.set("playlis",playlis);
			}

			//获取分页的视频
			if(url && url.indexOf("play/ep")>-1){
				// 电影、视频类 --- 获取mp4后也会被B站屏蔽（根据host）
				//	https://www.bilibili.com/bangumi/play/ep473543

				if(!aid)return layer.msg("视频获取失败(aid)");
				var vurl=URL.videopage2+"avid="+aid+"&cid="+cid;
			}else{
				var vurl=URL.videopage+"bvid="+bvid+"&cid="+cid;
			}

			var mp4=get(vurl);
			if(mp4.code)return layer.msg(mp4.message);
			var mp4url=mp4.data?mp4.data.durl[0].url:mp4.result.durl[0].url;

			//
			//如果是视频集，记录page
			if(pages.length>1){
				var page=0;
				for(var i in pages)if(pages[i].cid==cid)page=i;
				var i = record.findIndex((json) => json.bvid==bvid);
				if(i>-1){
					record[i].page=page;
					C.set("record",record);
					$(".player").attr("page",page);
				}
			}

			//去播放
			var video=$("#biliplayer");
			var iframe=$("#bili_mp4_iframe");
			iframe.hide().attr("src","");
			if(vurl.indexOf("avid=")>-1){
				video.hide();
				var mp4url=URL.kuayu+"mp4/"+encodeURIComponent(mp4url);

				//默认音量
				mp4url+="___0.7";
				//传递进度
				var find = record.find((json) => json.bvid==bvid);
				if(find)mp4url+="___"+(find.vtime<(find.vlong-5)?parseInt(find.vtime):0);
				else mp4url+="___0";


				iframe.attr("src",mp4url+"/");
				video[0].pause();
			}else{
				video.attr("src",mp4url).show();

			}
			return video[0];
		}
		var video=videoURL(cid,bvid,aid);


		//是否本地收藏
		const isfav = favlis.findIndex((json) => json.bvid==bvid);
		if(isfav>-1)$(".player .btn .fav").addClass("on");
		else $(".player .btn .fav").removeClass("on");

		//是否网上-点赞、收藏
		if(root.user.uid)
		get(URL.iszan+bvid,function(db){
			if(!db.data)return;
			if(db.data.like){
				$(".player .r .zan").addClass("on");
				if(zanlis.indexOf(bvid)==-1)zanlis+=","+bvid;
			}else{
				$(".player .r .zan").removeClass("on");
				if(zanlis.indexOf(bvid)==-1)zanlis=zanlis.replace(","+bvid,"");
			}
			C.set("zanlis",zanlis);

			if(db.data.coin){
				$(".player .r .toubi").addClass("on").attr("bi",db.data.coin);
			}else{
				$(".player .r .toubi").removeClass("on").removeAttr("bi",db.data.coin);
			}

			if(db.data.favorite){
				$(".player .r .fav").addClass("on");
				//本机如果没有收藏，添加一下?
			}else{
				$(".player .r .fav").removeClass("on");
			}


		})


		$(".player .author").html("UP主：<b>"+db.data.owner.name+"</b> 播放：<b>"+wan(db.data.stat.view)+"</b>");
		$(".player .l").html("").hide();
		if(pages.length>1){
			$(".player .l,.player .r .suiji").show();
			for(var i in pages){
				pages[i]['bvid']=bvid;
				$(".player .l").append("<a tit='"+pages[i].part+"' class='"+(cid==pages[i].cid?"on":"")+"' bvid='"+bvid+"' cid='"+pages[i].cid+"' page='"+i+"'>P"+pages[i].page+" "+pages[i].part+"</a>");
			}
		}else{
			$(".player .r .suiji").hide();
			//如果有合集
			if(db.data.ugc_season){
				pages=[];
				$(".player .l,.player .r .suiji").show();
				var heji=db.data.ugc_season.sections[0].episodes ||[];
				for(var i in heji){
					if(!heji[i].bvid)continue;
					if(heji[i].bvid==bvid)$(".player").attr("page",i)
					pages.push({bvid:heji[i].bvid,cid:heji[i].cid,aid:0});
					$(".player .l").append("<a page='"+i+"' class='"+(heji[i].bvid==bvid?"on":"")+"'  tit='"+heji[i].title+"' bvid='"+heji[i].bvid+"' cid='"+heji[i].cid+"'>P"+(i-0+1)+" "+heji[i].title+"</a>");
				}
			}
		}
		$(".player .r .kanbili").attr("href","https://www.bilibili.com/video/"+bvid);
		$(".player").attr("cid",cid);
		//缓存--用于点击事件
		root.Config={
			cid:cid,bvid:bvid,aid:aid,
			title:title,img:img,
			pages:pages,ping:0,
		}



		//------------绑定事件
		if(!root.bangdingJS){
			root.bangdingJS=1;
			var ping;
			$(".player .author,.player .pinglun").click(function(){
				if(!root.Config.ping){
					ping=get(URL.ping+root.Config.aid+"&next=0");
					if(!ping.data)return layer.msg("数据错误");
					if(!ping.data.replies.length)return layer.msg("没有评论");
					//下一页
					var p2=get(URL.ping+root.Config.aid+"&next="+ping.data.cursor.next);
					ping=ping.data.replies;
					if(p2.data){
						if(p2.data.replies.length)ping=ping.concat(p2.data.replies);
					}
					root.Config.ping=ping.length;
				}
				showPing(ping);

			})

			function showPing(p){
				if(!p.length)return;
				var ol="";
				for(var i in p){
					ol+="<li>"+p[i].content.message.replace(/\[.[^\]]*\]/g,"")
					for(var j in p[i].replies){
						ol+="<div>"+p[i].replies[j].content.message.replace(/回复 \@.[^\:]*\:|\[.[^\]]*\]/g,"")+"</div>";
					}
					ol+="</li>";
				}
				layer.msg(
				'<ol class="ping">'+ol+'</ol>', {
				shade: [0.8, '#393D49'],
				area: ['100%', '100%'],time:-1,
				btn: ['关闭评论']
				});
			}



			//--------------------------左侧分页----------------

			$(".player .l").on("click","a",function(){
				var A=$(this);
				var aid=A.attr("aid")||0;
				var bvid=A.attr("bvid");
				var cid=A.attr("cid");
				var page=A.attr("page")||1;
				$(".player").attr("page",page)

				$(this).addClass("on").siblings().removeClass("on");
				document.title=A.attr("tit");
				videoURL(cid,bvid,aid);
				$(".player .r .xunhuan i").text('');
			})


			//--------------------------中间相关视频----------------
			$(".xianguan").on("click", "a", function () {
				//return oneWin("bilibili_player.html?bvid="+$(this).attr("bvid"));
				root.player($(this).attr("bvid"));
			})

			//--------------------------右侧按钮----------------
			//点赞
			$(".player .r .zan").click(function(){
				if(!root.user.uid)return layer.msg("尚未未登录，不能点赞");
				$(this).addClass("ing");
				var url=URL.kuayu+'zan/'+($(this).hasClass("on")?2:1)+'_'+root.Config.aid+'_'+root.user.csrf+'/';
				var iframe=$("#bili_zan_iframe");
				if(iframe[0]){
					iframe.attr("src",url);
				}else{
					iframe = document.createElement('iframe');
					iframe.style.cssText = 'display: none;';
					iframe.id="bili_zan_iframe";
					iframe.src = url;
					document.body.appendChild(iframe);
				}
			})
			//投币
			$(".player .r .toubi").click(function(){
				if($(this).attr("bi")>maxtoubi)return layer.msg("投币已达上限");
				if(!root.user.uid)return layer.msg("尚未未登录，不能投币");
				$(this).addClass("ing");
				var url=URL.kuayu+'toubi/1_'+root.Config.aid+'_'+root.user.csrf+'/';
				var iframe=$("#bili_toubi_iframe");
				if(iframe[0]){
					iframe.attr("src",url);
				}else{
					iframe = document.createElement('iframe');
					iframe.style.cssText = 'display: none;';
					iframe.id="bili_toubi_iframe";
					iframe.src = url;
					document.body.appendChild(iframe);
				}
			})


			//点收藏--本机收藏
			$(".player .r .fav").click(function(){
				var bvid=root.Config.bvid;
				var tishi='';

				var i = favlis.findIndex((json) => json.bvid==bvid);
				if(i>-1){
					favlis.splice(i,1);//删除
					$(this).removeClass("on");
					layer.msg('已取消收藏');
				}else{
					favlis.unshift({bvid:bvid,aid:root.Config.aid,cid:root.Config.cid,title:root.Config.title,img:root.Config.img});
					$(this).addClass("on");
					layer.msg('已加入收藏');
				}
				C.set("favlis",favlis);

				//传递数据给主页，修改收藏按钮、刷新收藏页面
				chrome.runtime.sendMessage({connect:sendMessage.biliIndex,act:sendMessage.HTML,bvid:bvid,action:"favState",state:i==-1});

				get(URL.favlis+root.user.uid,function(db){
					if(!db.data)return console.log("error");
					//收藏到bilibili网--默认收藏夹
					var folder=db.data.list[0].id;
					var url=URL.kuayu+'fav/'+(i>-1?2:1)+'_'+root.Config.aid+'_'+folder+'_'+root.user.csrf+'/';
					var iframe=$("#bili_fav_iframe");
					if(iframe[0]){
						iframe.attr("src",url);
					}else{
						iframe = document.createElement('iframe');
						iframe.style.cssText = 'display: none;';
						iframe.id="bili_fav_iframe";
						iframe.src = url;
						document.body.appendChild(iframe);
					}
				});





			})
			//循环播放
			$(".player .r .xunhuan").click(function(){
				if($(this).hasClass("on")){
					$(".player").removeAttr("xunhuan");
					$(this).removeClass();
				}else{
					$(this).addClass("on");
					$(".player").attr("xunhuan",1);
				}
			});


			//--------------------------播放器事件----------------
			function winResize(full){
				var w=video.videoWidth;
				var h=video.videoHeight;
				var winW=screen.width;
				var winH=screen.height;
				if (!full) {
					var vw,vh,vt;
					//调整全屏状态下的视频比例
					var wx=winW/w;
					var hx=winH/h;
					if(wx<hx){
						vw=winW;
						vh=h*wx;
						vt=(winH-vh)/2;

					}else{
						vw=w*hx;
						vh=winH;
						vt=0;
					}
					$(".player .video").css({width:vw,height:vh,"margin-top":vt});
					//console.log("调整视频W:"+vw+",H:"+vh);
				}else{
					//调整播放窗口
					if(!w || !h)return;
					var W=heilis.winwidth;
					var H=heilis.winwidth/w*h+30;
					if(H>winH){
						H=winH;
						W=winH/h*w;
					}
					oneWin('',W,H);
					$(".player .video").css({width:"100%",height:"100%","margin-top":0});
					//console.log("调整窗口W:"+W+",H:"+H);
				}
			}
			//全屏
			document.addEventListener('keydown',function(event){
				if(event.ctrlKey || event.shiftKey || event.altKey)return;
				var code=event.keyCode;
				if (code == 70 || event.key === "F11"){
					if (!document.fullscreenElement) {
						//video.requestFullscreen();
						$("body")[0].requestFullscreen();
					}else{
						document.exitFullscreen();
					}
					winResize(document.fullscreenElement);//将用户手动最大化的窗口还原
					event.preventDefault();
				}else if(code == 32){
					if (video.paused()) video.play();
					else video.pause();
				}else if(code == 37 || code == 39){
					var x=10;
					if(code==37)x=-3;
					var old=parseInt(video.name-0);//屏蔽掉系统的调整进度
					video.currentTime=old+x;
					video.name=old+x;

				}else if(code == 38 || code == 40){
					var x=10*(code==38?1:-1);
					var sound=parseInt(video.volume.toFixed(2)*100)+x;

					sound=Math.min(100,Math.max(0,sound));

					video.volume=(sound/100).toFixed(2);

					layer.msg(sound?('音量:'+sound):"已静音",{offset:"rb"});
				}
			})
			video.addEventListener('error', function(e) {
				layer.msg("视频加载失败");
				var cid=root.Config.cid;
				if($(".player").attr("cid")==cid){
					layer.msg("视频重载中...");
					$(".player").attr("cid",'');
					setTimeout(function(){
						videoURL(cid,root.Config.bvid,root.Config.aid);
					},1000);
				}else{
					if($(".player").attr("xunhuan"))location.reload();
				}
			})
			video.addEventListener('pause', function(e) {
				//if(!C.get("connect")){
				//	record[recordI].vtime=parseInt(video.currentTime);
				//	C.set("record",record);
				//}
				//传递给主页
				var bvid=root.Config.bvid;
				chrome.runtime.sendMessage({connect:sendMessage.biliIndex,act:sendMessage.vTime,bvid:bvid,state:'pause',vlong:video.duration,vtime:video.currentTime});

			})
			video.addEventListener('play', function(e) {
				$(".xianguan").hide();
				root.vtimeT=0;
			})

			video.addEventListener('loadedmetadata', function(e) {
				winResize(!document.fullscreenElement)
				$(".xianguan").hide();

				layer.close(root.layerT);

				if(record[recordI].bvid==root.Config.bvid){
					if(video.duration-record[recordI].vtime>5)video.currentTime = record[recordI].vtime;
				}
				video.volume =0.7;
			})

			video.ontimeupdate=function(){
				video.name=video.currentTime;
				//3秒记录1次
				if(!((video.currentTime-root.vtimeT)>1.5))return;
				root.vtimeT=video.currentTime;

				var bvid=root.Config.bvid;
				if(record[recordI].bvid==bvid){
					//if(!C.get("connect")){
					//	record[recordI].vtime=parseInt(video.currentTime);
					//	C.set("record",record);
					//}
				}else{
					return root.vtimeT=999999;//播放的时候，删除了历史记录，就不再记录播放时间了
				}
				var bvid=root.Config.bvid;
				//传递给主页
				chrome.runtime.sendMessage({connect:sendMessage.biliIndex,act:sendMessage.vTime,bvid:bvid,state:"update",vlong:video.duration,vtime:video.currentTime});
			}

			//播放结束
			video.addEventListener('ended', function(e) {
				if($(".player").attr("xunhuan")){
					$(".player .r .xunhuan i").text(($(".player .r .xunhuan i").text()-0+1)||2);
					video.currentTime =0;
					video.play();
					return;
				}
				var bvid=root.Config.bvid;


				//标记播放进度为0
				if(record[recordI].bvid==bvid){
					record[recordI].vtime=0;
					record[recordI].watch=1;//已看
					C.set("record",record);
				}
				//播放[播放单]中的下一个
				var playlis=C.get("playlis",'array');
				var next='';
				for(var i in playlis){
					if(!playlis[i].played && playlis[i].bvid!=bvid){
						next=playlis[i].bvid;//接着播放下一个，不是从第一个播放
					}
				}
				if(next)return root.player(next);


				//如果播单中的最后一个视频是合集，会接着播放合集
				//播放[视频集]中的下一个
				var pages=root.Config.pages;
				if(pages.length>1){
					var page=$(".player").attr("page")||0;
					if((pages.length-page)>1){
						page=page-0+1;
						videoURL(pages[page].cid,pages[page].bvid,pages[page].aid);
						$(".player .l a").eq(page).addClass("on").siblings().removeClass("on");
						$(".player").attr("page",page)
						return;
					}
				}


				//显示中间的相关视频
				$(".xianguan ul").html("");
				var xg=get(URL.xianguan+bvid);
				for(var i in xg.data.Related){
					var li=xg.data.Related[i];
					if(viewlis.indexOf(li.bvid)>-1)continue;//跳过看过的 视频
					if(!guolv(li.bvid,li.title,li.owner.name))continue;
					$(".xianguan").show();
					$(".xianguan ul").append("<li><a tit='"+li.title+"' bvid='"+li.bvid+"' cid='"+li.cid+"'><img src='"+li.pic+"'/><span>"+li.title+"</span></a></li>");
				}

			})
		}
		//----------绑定JS结束
	}

	//iframe浏览B站，进行播放
	this.iframe=function(db){
		var root=this;
		var bvid;
		if(root.Config)bvid=root.Config.bvid;
		if (db.type == 'resizeIframe') {
			root.vtimeT=0;
			$("#bili_mp4_iframe").show();
			$(".xianguan").hide();
			$(".player .btn").show();//按钮事件

			if(document.fullscreenElement){
				//
			}else{
				//调整播放窗口
				var w=db.w;
				var h=db.h;
				if(!w || !h)return;
				var W=heilis.winwidth;
				var H=heilis.winwidth/w*h;
				var winH=screen.height;
				if(H>winH){
					H=winH;
					W=winH/h*w;
				}
				oneWin('',W,H);
			}
			layer.close(root.layerT);
		}else if (db.type == 'currentTime' || db.type == 'pause' || db.type == 'ended') {
			if(db.type == 'currentTime'){
				//播放进度
				if(root.vtimeT==999999)return;
				var recordI=record.findIndex((json) => json.bvid==bvid);
				if(recordI==-1)return root.vtimeT=999999;
				//record[recordI].vtime=db.vtime;
				//C.set("record",record);

				//传递给主页---进度条
				chrome.runtime.sendMessage({connect:sendMessage.biliIndex,act:sendMessage.vTime,bvid:bvid,vlong:db.vlong,vtime:db.vtime});


			}else if(db.type == 'ended'){
				//播放结束
				if($(".player").attr("xunhuan")){
					$(".player .r .xunhuan i").text(($(".player .r .xunhuan i").text()-0+1)||2);
					document.querySelector('#bili_mp4_iframe').contentWindow.postMessage({act:'play'}, '*');
					return;
				}

				//显示中间的相关视频
				var xg=get(URL.xianguan+bvid);
				for(var i in xg.data.Related){
					var li=xg.data.Related[i];
					if(viewlis.indexOf(li.bvid)>-1)continue;//跳过看过的 视频
					if(!guolv(li.bvid,li.title,li.owner.name))continue;
					$(".xianguan").show();
					$(".xianguan ul").append("<li><a tit='"+li.title+"' bvid='"+li.bvid+"' cid='"+li.cid+"'><img src='"+li.pic+"'/><span>"+li.title+"</span></a></li>");
				}


			}else if(db.type == 'error'){
				layer.msg("视频播放失败",function(){
					location.reload();
				});
				return;
			}



		}else if (db.type == 'dianzan') {
			$(".player .r .zan").removeClass("ing");
			//点赞
			if(!db.ok){
				if(db.msg=="已赞过"){
				}else{
					return layer.msg(db.msg);
				}
			}
			if(db.like==2){
				layer.msg("已取消");
				$(".player .r .zan").removeClass("on");
				if(zanlis.indexOf(bvid)>-1){
					zanlis=zanlis.replace(","+bvid,"");
					C.set("zanlis",zanlis);
				}
			}else{
				layer.msg("已点赞");
				$(".player .r .zan").addClass("on");
				if(zanlis.indexOf(bvid)==-1){
					zanlis+=","+bvid;
					C.set("zanlis",zanlis);
				}
			}
		}else if (db.type == 'toubi') {
			$(".player .r .toubi").removeClass("ing");
			var bi=$(".player .r .toubi").attr("bi")||0;
			if(!db.ok){
				if(db.msg.indexOf("上限")>-1){
					layer.msg("投币已达上限");
				}else{
					return layer.msg(db.msg);
				}
			}else{
				bi=bi-0+1;
			}
			$(".player .r .toubi").addClass("on").attr("bi",bi);

		}else if (db.type == 'fav') {
			//console.log("fav-back",db);
		}else if (db.type == 'fullscreen') {
			if (!document.fullscreenElement) {
				$("body")[0].requestFullscreen();
			}else{
				document.exitFullscreen();
			}
		}

	}

		//图标
	this.oneWinICO=function (ico){
		var iconElement = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
		if (!iconElement)return;
		ico=(ico||heilis.icons)||1;
		iconElement.href = '/pic/'+ico+'.png';
	}

}

var bili;
jQuery(document).ready(function(){
	bili=new bilibili();
	if($(".missde").length){

		//接收消息
		chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
			if(msg.connect==sendMessage.biliIndex){
				if(msg.act==sendMessage.vTime)bili.updateVtime(msg);
				else if(msg.act==sendMessage.HTML)bili.updateHTML(msg);
			}
		});


		bili.index();



		reLisSize();
		function reLisSize(){
			//列表宽度
			var W=$(".missde .box").width()-130;
			var kongbai=parseInt(W/255);
			var x=Math.ceil(W/255)
			if(kongbai>30){
				var w=W/(x+1);
			}else{
				var w=W/x;
			}
			var w=parseInt(w)-20;

			var styleElem = document.querySelector('style');
			var css = styleElem.textContent;
			css=css.replace(/\.bili dd ul li.*/,'');
			css=css+'.bili dd{width:'+(W-10)+'px;} .bili dd ul li{width:'+w+'px} .bili dd ul{width:'+(W+20)+'px}'
			styleElem.innerHTML = css;

			$(".bili .group").width(W-10);

		}
		window.addEventListener("resize", reLisSize);

		$(window).scroll(function(){
			if($(this).scrollTop()>60)$(".bili").addClass('scro');
			if($(this).scrollTop()<60)$(".bili").removeClass('scro');
		});


	}else if($(".player").length){
		//与background.js通讯
		chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
			if(msg.connect==sendMessage.biliPlayer){
				var re={ success: true};
				if(msg.icons)bili.oneWinICO(msg.icons);
				else if(msg.act==sendMessage.playbvid)bili.player(msg.bvid);
				else if(msg.act==sendMessage.resize)location.reload();
				else if(msg.act==sendMessage.URL){
					re.url=location.href;
					setTimeout(function(){window.close()},100);
				}
				sendResponse(re);
				return true;
			}
		});


		//取地址栏中，最右侧的bvid
		var url=location.href;
		var r = url.replace("undefined","").match(/bvid=\w+/ig);
		if(r)r=r[r.length-1].replace(/bvid\=/i,'');
		if(!r)return $("body").html("<h1 style='text-align:center;font-size:100px;color:#fff;'>404</h1>");

		setTimeout(function(){bili.player(r)},100);

		//点击了窗口最大按钮时 --防止竖屏过长
		window.onresize = function() {
			if ((screen.width-window.innerWidth)<100) {
				var video=$("#biliplayer")[0];
				if(video.videoHeight>video.videoWidth){
					var w=window.innerHeight/video.videoHeight*video.videoWidth
					$(".video").css({width:w,height:window.innerHeight});
				}
			}else{
				$(".video").css({width:"auto",height:"auto"});
			}
		}
	}

})

//来自剧集页面的对话
window.addEventListener('message', function(event) {
	if(event)bili.iframe(event.data);
});
