
var express = require('express'),
port = process.env.PORT || 5000,
app = express(),
http = require('http'),
server = http.createServer(app),
Twit = require('twit'),
io = require('socket.io').listen(server);

app.use(express.static(__dirname + "/"));

server.listen(port);

// routing
app.get('/', function (req, res) {
  console.log(req.headers);
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

var world = [ '-180', '-90', '180', '90' ];
var total=0;
var totalSent=0;

var T = new Twit({  // You need to setup your own twitter configuration here!
  consumer_key:   'ztjHEqy6sB6YA5Ivx2iwwS3MG',
  consumer_secret: 'Iv6r772OMpcWD54ODrrMr1v4w8QmlpAPMEv2lDllSQWPuqR15o',
  access_token:    '4135689035-Cfoql8CdXQNfPcupDh9ZZygm0mFq9HBYvmPB7M6',
  access_token_secret: 'pQK9ylbDXJrauQAnzbvLHXK7zW8UnVoqjYptBTkpqN2Gp'
});




var stream = T.stream('statuses/filter',  { locations: world});

stream.on('error',function(error){
  console.log(error);
});
stream.on('limit', function (limitMessage) {
  console.log("Limit:"+JSON.stringify(limitMessage));
});
stream.on('tweet', function (tweet) {
 
  if(tweet.geo){
    total+=1;
    var coords=tweet.geo.coordinates;
    clients.forEach(function(socket){
      var currentBounds=bounds_for_socket[socket.id];


        totalSent+=1;
        if(totalSent%100==0)console.log("Sent:"+totalSent);
        var smallTweet={
          text:tweet.text,
          user:{   screen_name:       tweet.user.screen_name,
                   profile_image_url: tweet.user.profile_image_url,
                   id_str:            tweet.user.id_str},
          geo:tweet.geo
        };
        socket.emit('stream',smallTweet);
    });
  }
  });

var bounds_for_socket={}; // Will contains a hash association between socket_id -> map bound for this client
var clients=[];  // the list of connected clients
io.sockets.on('connection', function (socket) {
  socket.on('recenter',function(msg){
    console.log("recenter:"+msg);
    bounds_for_socket[this.id]=JSON.parse("["+msg+"]");
  });
  socket.on('disconnect',function(socket){
    //  Here we try to get the correct element in the client list
    for(var i=0;i<clients.length;i++){
      client=clients[i];
      if(client.client.id==this.id){clients.splice(i,1)}
    }
    delete bounds_for_socket[this.id];

    console.log("disconnect , there is still:"+clients.length+" connected ("+Object.keys(bounds_for_socket).length+')');
  });
  clients.push(socket); // Update the list of connected clients
  currentBounds=JSON.parse(socket.handshake.query.bounds);
  bounds_for_socket[socket.id]=currentBounds;
  console.log('Connected, total:'+clients.length+' ('+Object.keys(bounds_for_socket).length+')');
});
;