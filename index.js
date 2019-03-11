var path = require('path')
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

//array to store chat log
var chatLog = [];
//array to keep track of the list of active users
var users = [];

//special user for system messages
var system = {
	name: "SYSTEM",
	nickname: "SYSTEM",
	color: ""
}

//special user for error messages
var error = {
	name: "ERROR",
	nickname: "ERROR",
	color: ""
}

app.use(express.static(path.join(__dirname, '/public')));

io.on('connection', function(socket){
	//for every connection, assign a username
	//Username = User + a randomly generated number between 0 and 999,999
	var assignedName = 'User' + Math.floor((Math.random() * 1000000));
	socket.emit('set username', assignedName);
	//retrieve chat log
	socket.emit('retrieve log', chatLog);

	//actions to be taken when a user joins after they are given a username
	socket.on('join', function(user){
		//check if the user already exists in the list of users
		//if they do, don't create a new record
		exists = false;
		for (var i=0; i < users.length; i++){
			if (users[i].name.localeCompare(user.name) == 0){
				users[i] = user;
				exists = true;
			}
		}
		//if they don't, create a new record
		if (!exists){
			users.push(user);
		}
		//make all connections update the list of online users
		io.emit('list users', users);
		console.log(users);
	});

	//actions to be a taken when a user submits a message/command
	socket.on('chat message', function(msg, user){
		//retrieve current time
		var date = new Date();
		//construct a message
		//each message consists of
		//	the time it was sent
		//	the user who sent it
		//	the text of the message
		var message = {
			hour: date.getHours(),
			minute: date.getMinutes(),
			second: date.getSeconds(),
			user: user,
			text: msg
		}
		//check if the message is a /nick command
		if (msg.startsWith("/nick ")){
			message.user = system;
			var command = msg.split(" ");
			//check if the command is valid
			//if it is, change the nickname
			if (validNickname(command)){
				socket.emit('change nickname', command[1]);
				message.text = '<i>' + user.nickname + ' changed their nickname to ' + command[1] + '</i>';
				io.emit('chat message', message);
			}
			//if not, send error message
			//error messages are only sent to users who sent the command
			else{
				message.user = error;
				message.text = '<i>Nickname change failed<br>Usage: /nick -nickname-<br>Please ensure the new ' +
				'nickname is unique</i>';
				socket.emit('chat message', message);
			}
		}
		//check if the message is a /nickcolor command
		else if (msg.startsWith("/nickcolor ")){
			message.user = system;
			var command = msg.split(" ");
			//check if the command is valid
			//if it is, change the nickname color
			if (validColor(command)){
				socket.emit('change color', command[1]);
				message.text = '<i>' + user.nickname + ' changed their color to ' + command[1] + '</i>';
				io.emit('chat message', message);
			}
			//if not, send error message
			//error messages are only sent to users who sent the command
			else{
				message.user = error;
				message.text = '<i>Color change failed<br>Usage: /nickcolor -color-<br>If you are using hex notation, ' +
				'include a "#" before the color</i>';
				socket.emit('chat message', message);
			}
		}
		//if it's a regular message, just send it to everyone
		else{
			io.emit('chat message', message);
		}
		chatLog.push(message);
	});

	//actions to be taken when a user changes their nickname or color
	socket.on('update user', function(user){
		//find the record of the user in the list of users
		//update it
		for (var i=0; i < users.length; i++){
			if (users[i].name.localeCompare(user.name) == 0){
				users[i] = user;
			}
		}
		//make all connections update the list of online users
		io.emit('list users', users);
		console.log(users);
	});

	//actions to be taken when a user disconnects
	socket.on('disconnect', function(socket){
		//find the disconnected user, remove their record from the list of online users
		for (var i=0; i < users.length; i++){
			if (users[i].name.localeCompare(assignedName) == 0){
				users.splice(i, 1);
				io.emit('list users', users);
				console.log(users);
			}
		}
	});

});

http.listen(port, function(){
	console.log('listening on *:' + port);
});

//function to check if a nickname command is valid
function validNickname(command){
	var valid = true;
	//check that the command is only 2 words
	if (command.length > 2){
		valid = false;
	}
	//check that the new nickname is not already taken
	else{
		for (var i=0; i < users.length; i++){
			if (users[i].nickname.localeCompare(command[1]) == 0){
				valid = false;
			}
		}
	}
	return valid;
}

//function to check if a nickname color command is valid
function validColor(command){
	var valid = true;
	//check that the command is only 2 words
	if (command.length > 2){
		valid = false;
	}
	return valid;
}
