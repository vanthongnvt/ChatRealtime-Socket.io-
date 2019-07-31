var express = require('express');

var app = express();

// var session = require('express-session');

app.use(express.static("public"));
app.use(express.json());
// app.use(session());

app.set("view engine","ejs");
app.set("views","./views");

var server=require("http").createServer(app);

var io = require('socket.io')(server);

var fs=require('fs');

server.listen(3000);

// app.listen(3000);


var arr_users=[];
//listen connection
io.on("connection",function(socket){

	console.log(socket.id + " connected");

	socket.on("disconnect",function(){
		
		if(typeof socket.username === 'undefined'){
			return false;
		}

		console.log(socket.id + " disconnected");
		//use array
		arr_users.splice(arr_users.indexOf(socket.username),1);

		io.emit('Server-send-user-offline',socket.id);

		//use file
		var file=fs.readFileSync('users.json',{encoding: 'utf-8', flag: 'r'});
		file=JSON.parse(file);

		file.users.forEach(function(user,index){
			if(user.id===socket.id){
				file.users.splice(index,1);
				return false;
			}
		});
		fs.writeFileSync('users.json',JSON.stringify(file),{encoding: 'utf-8', flag: 'w'});
	});

	socket.on("Client-send-mgs",function(data){
		socket.broadcast.emit('Server-send-data',data);
	});

	socket.on('Newuser-join',function(name){

		//use array
		arr_users.push(name);
		socket.username=name;

		//use file
		var file=fs.readFileSync('users.json',{encoding: 'utf-8', flag: 'r'});
		file=JSON.parse(file);

		file.users.unshift({name:name,id:socket.id});

		var newuser={name:name,id:socket.id};
		var data={auth:newuser,users:file.users};


		socket.broadcast.emit('Server-send-new-user',newuser);

		socket.emit('Server-send-list-user',data);

		fs.writeFileSync('users.json',JSON.stringify(file),{encoding: 'utf-8', flag: 'w'});
	});

	socket.on('Create-user',function(data){
		if(arr_users.indexOf(data)>=0){
			socket.emit('Create-user-failed');
		}
		else{
			socket.emit('Create-user-sucessed');
		}
	});


	socket.on('Client-typing',function(){
		socket.broadcast.emit('Noti-user-typing',{name:socket.username,id:socket.id});
	});

	socket.on('Client-stop-typing',function(){
		socket.broadcast.emit('Noti-user-stop-typing',{name:socket.username,id:socket.id});
	});
});

app.get('/',function(req,res){
	res.render("home");

});

app.get('/create-user',function(req,res){
	res.render("createuser");

});


app.post('/post-user',function(req,res){
	var username=req.body.username;
	console.log(username);
	return res.redirect('/home');
});