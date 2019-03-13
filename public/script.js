var socket = io();
//
var user = {
	name: "",
	nickname: "",
	color: ""
}

$(function () {

	$('form').submit(function(){
		socket.emit('chat message', $('#m').val(), user);
		$('#m').val('');
		return false;
	});

	socket.on('set username', function(name){
		//check if cookies exist
		//taken from: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
		if (document.cookie.split(';').filter(function(item){return item.trim().indexOf('name=') == 0}).length) {
			//if cookies exist, populate the user variable with the cookies
			user.name = parseCookies("name=");
			user.nickname = parseCookies("nickname=");
			user.color = parseCookies("color=");
		}
		else {
			//if not, set new records
			user.name = name;
			user.nickname = name;
			document.cookie = "name=" + user.name;
			document.cookie = "nickname=" + user.nickname;
		}
		//inform the server that the user joined
		socket.emit('join', user);
	});

	//retrieve and display the chat log
	socket.on('retrieve log', function(log){
		for (var i=0; i < log.length; i++){
			if (log[i].user.name.localeCompare("ERROR") == 0){
				continue;
			}
			appendMessage(log[i]);
		}
		window.scrollTo(0, document.body.scrollHeight);
	});

	//actions to be taken when a nickname is changed
	socket.on('change nickname', function(nickname){
		user.nickname = nickname;
		document.cookie = "nickname=" + user.nickname;
		socket.emit('update user', user);
	});

	//actions to be taken when a color is changed
	socket.on('change color', function(color){
		user.color = color;
		document.cookie = "color=" + user.color;
		socket.emit('update user', user);
	});

	//action to be taken when the list of online users needs to be updated
	socket.on('list users', function(users){
		$('#users').empty();
		for (var i=0; i < users.length; i++){
			//add "(YOU)" is the user being listed is the current user
			if (users[i].name.localeCompare(user.name) == 0){
				$('#users').append($('<li>' + users[i].nickname + ' (YOU)</li>'));
			}
			else{
				$('#users').append($('<li>' + users[i].nickname + '</li>'));
			}
		}
	});

	//action to be taken when a message has been sent
	socket.on('chat message', function(message){
		appendMessage(message);
		window.scrollTo(0, document.body.scrollHeight);
	});

});

//fucntion to append a message to the message display
function appendMessage(message){
	//retrieve the message information
	var messageText = message.text;
	var hour = message.hour;
	var minute = message.minute;
	var second = message.second;
	var name = message.user.name;
	var color = message.user.color;
	var nickname = message.user.nickname;
	//format the time
	if (hour < 10){
		hour = '0' + hour;
	}
	if (minute < 10){
		minute = '0' + minute;
	}
	if (second < 10){
		second = '0' + second;
	}
	//print all messages that are not error messages
	if (name.localeCompare(user.name) == 0){
		//bold messages that are sent by the current user
		$('#messages').append($('<li>' + hour + ':' + minute + ':' + second +
		'  ' + '<span style="color:' + color + '">' + nickname + '</span>' + ':  <b>' + messageText + '</b></li>'));
	}
	else{
		$('#messages').append($('<li>' + hour + ':' + minute + ':' + second +
		'  ' + '<span style="color:' + color + '">' + nickname + '</span>' + ':  ' + messageText + '</li>'));
	}
}

//function to retrieve cookies
function parseCookies(cookie){
	var cookies = document.cookie.split('; ');
	var value = "";
	for (var i=0; i < cookies.length; i++){
		if (cookies[i].startsWith(cookie)){
			var temp = cookies[i].split('=');
			value = temp[1];
		}
	}
	return value;
}
