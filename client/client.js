(function () {
	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;
	
	
	w.CHAT = {
		msgObj:d.getElementById("message"),
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		userid:null,
		socket:null,
		//让浏览器滚动条保持在最低部
		scrollToBottom:function(){
			w.scrollTo(0, this.msgObj.clientHeight);
		},
		//退出
		logout:function(){
			this.socket.disconnect();
			location.reload();
		},
		//提交聊天消息内容
		submit:function(){
			var content = d.getElementById("content").value;
			if(content != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					content: content
				};
				this.socket.emit('message', obj);
				d.getElementById("content").value = '';
			}
			return false;
		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		gUid: function() {
			var str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
			return str.replace(/[xy]/g, function(c){
				var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			}).toUpperCase();
		},
 		//更新系统消息，本例中在用户加入、退出的时候调用
		updateSysMsg:function(o, action){
			//当前在线用户列表
			var onlineUsers = o.onlineUsers;
			//当前在线人数
			var onlineCount = o.onlineCount;
			//新加入用户的信息
			var user = o.user;
				
			//更新在线人数
			var userhtml = '';
			var separator = '';
			for(key in onlineUsers) {
		        if(onlineUsers.hasOwnProperty(key)){
					userhtml += separator+onlineUsers[key];
					separator = '、';
				}
		    }
			d.getElementById("onlinecount").innerHTML = '当前共有 '+onlineCount+' 人在线，在线列表：'+userhtml;
			
			//添加系统消息
			var html = '';
			html += '<div class="msg-system">';
			html += user.username;
			html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			this.msgObj.appendChild(section);	
			this.scrollToBottom();
		},
		//第一个界面用户提交用户名
		usernameSubmit:function(){
			var username = d.getElementById("username").value;
			if(username != ""){
				d.getElementById("username").value = '';
				d.getElementById("loginbox").style.display = 'none';
				d.getElementById("chatbox").style.display = 'block';
				this.init(username);
			}
			return false;
		},
		init:function(username){
			/*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/
			var that = this;
			this.userid = this.gUid();
			this.username = username;
			
			d.getElementById("showusername").innerHTML = this.username;
			//this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
			this.scrollToBottom();
			
			//连接websocket后端服务器
			this.socket = io.connect('ws://192.168.1.166:3004');
			// this.socket.emit('group1');
			//告诉服务器端有用户登录
			this.socket.emit('login', {userid:this.userid, username:this.username});
			
			//监听新用户登录
			this.socket.on('login', function(o){
				console.log(o);
				CHAT.updateSysMsg(o, 'login');	
			});
			
			//监听用户退出
			this.socket.on('logout', function(o){
				CHAT.updateSysMsg(o, 'logout');
			});
			
			//监听消息发送
			this.socket.on('message', function(obj){
				var isme = (obj.userid == CHAT.userid) ? true : false;
				var contentDiv = '<div>'+ that.displayEmoji(obj.content)+'</div>';
				var usernameDiv = '<span>'+obj.username+'</span>';
				var userIcon = '<span class="u_icon"></span>';
				
				var section = d.createElement('section');
				if(isme){
					section.className = 'user';
					section.innerHTML = contentDiv + userIcon + usernameDiv;
				} else {
					section.className = 'service';
					section.innerHTML = usernameDiv + userIcon + contentDiv;
				}
				CHAT.msgObj.appendChild(section);
				CHAT.scrollToBottom();	
			});
			this.socket.on('msgImg', function(obj) {
			    that.displayImage(obj);
			});	
			this.initEmoji();
		},
		displayImage: function(obj) {
			var isme = (obj.userid == CHAT.userid) ? true : false;
			var contentDiv = '<div><a href="' + obj.content + '" target="_blank"><img src="' + obj.content + '" class="msgImg"/></a></div>';
			var usernameDiv = '<span>'+obj.username+'</span>';
			var userIcon = '<span class="u_icon"></span>';
			
			var section = d.createElement('section');
			if(isme){
				section.className = 'user';
				section.innerHTML = contentDiv + userIcon + usernameDiv;
			} else {
				section.className = 'service';
				section.innerHTML = usernameDiv + userIcon + contentDiv;
			}
			CHAT.msgObj.appendChild(section);
			CHAT.scrollToBottom();
		},
		sendImage: function (that) {
			var self = this;
			//检查是否有文件被选中
		    if (that.files.length != 0) {
		        //获取文件并用FileReader进行读取
		        var file = that.files[0],
		            reader = new FileReader();
		        if (!reader) {	            
		            that.value = '';
		            return;
		        }
		        reader.onload = function(e) {
		        	var obj = {
		        		userid: self.userid,
						username: self.username,
						content: e.target.result
		        	};
		            //读取成功，显示到页面并发送到服务器
		            that.value = '';		             
					self.socket.emit('msgImg', obj);
		        };
		        reader.readAsDataURL(file);
		    }
		},
		initEmoji: function() {
			var emojiCont = document.getElementById('emojis');
	        var _nodes = document.createDocumentFragment();
	        var i = 18;
	        var emoji;
		    while(i > 0) {
		        emoji = document.createElement('img');
		        emoji.title = i;
		        emoji.src = './assets/img/emoji/' + i + '.gif';
		        _nodes.appendChild(emoji);
		        i--;
		    }
		    emojiCont.appendChild(_nodes);
		},
		displayEmoji: function(msg) {
			var match, res = msg;
        	var reg = /\[emoji:\d+\]/g;
       		var emojiId;
        	var emojiNums = document.getElementById('emojis').querySelectorAll('img').length;
		    while (match = reg.exec(msg)) {
		        emojiId = match[0].slice(7, -1);
		        if (emojiId > emojiNums) {
		            res = res.replace(match[0], '[XX]');
		        }else {
		            res = res.replace(match[0], '<img class="emoji" src="./assets/img/emoji/' + emojiId + '.gif" />');
		        };
		    }
		    return res;
		}
	};
	//通过“回车”提交用户名
	d.getElementById("username").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.usernameSubmit();
		}
	};
	//通过“回车”提交信息
	d.getElementById("content").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.submit();
		}
	};
	d.getElementById("sendImg").onchange = function(e) {
		var that = this;
		CHAT.sendImage(that);    
	};	
	// d.getElementById('sendEmoji').addEventListener('click', function(e) {
	// 	console.log(d.getElementById('emojis'));
	// 	d.getElementById('emojis').style.display = 'block';
	// });
	d.body.addEventListener('click', function(e) {
		e = e || window.event;
		var target = e.target || e.srcElement;
		e.stopPropagation();
		var _id = target.id;
		var emojis = d.getElementById('emojis');
		if (_id != 'sendEmoji') {
			emojis.style.display = 'none';
		}else if (_id == 'sendEmoji') {
			emojis.style.display = 'block';
		}
	});
	d.getElementById('emojis').addEventListener('click', function(e) {
	    e = e || window.event;
	    var target = e.target || e.srcElement;
	    if (target.nodeName.toLowerCase() == 'img') {
	        var messageInput = document.getElementById('content');
	        messageInput.value += '[emoji:' + target.title + ']';
	        messageInput.focus();
	    }
	}, false);
})();